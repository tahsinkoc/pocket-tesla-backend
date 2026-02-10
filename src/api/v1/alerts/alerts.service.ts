// src/api/v1/alerts/alerts.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertRule, AlertRuleDocument, AlertType } from './schemas/alert-rule.schema';
import { AlertEvent, AlertEventDocument } from './schemas/alert-event.schema';
import { VehiclesService } from '../vehicles/vehicles.service';

export interface CreateAlertRuleDto {
  vehicleId: string;
  type: AlertType;
  threshold?: number;
  sleepThresholdMinutes?: number;
  enabled?: boolean;
}

export interface VehicleStatus {
  state: string;
  charge_state?: {
    battery_level: number;
    charging_state: string;
    charge_limit_soc: number;
  };
  vehicle_state?: {
    locked: boolean;
  };
  climate_state?: {
    is_climate_on: boolean;
  };
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  // Track last alert trigger time to prevent duplicates (5 minute window)
  private readonly lastAlertTimes = new Map<string, Date>();

  constructor(
    @InjectModel(AlertRule.name)
    private alertRuleModel: Model<AlertRuleDocument>,
    @InjectModel(AlertEvent.name)
    private alertEventModel: Model<AlertEventDocument>,
    private readonly vehiclesService: VehiclesService,
  ) {}

  /**
   * Create a new alert rule for a user
   */
  async createAlertRule(userId: string, dto: CreateAlertRuleDto): Promise<AlertRuleDocument> {
    const alertRule = new this.alertRuleModel({
      userId: new Types.ObjectId(userId),
      vehicleId: dto.vehicleId,
      type: dto.type,
      threshold: dto.threshold ?? 20,
      sleepThresholdMinutes: dto.sleepThresholdMinutes ?? 30,
      enabled: dto.enabled ?? true,
    });

    return alertRule.save();
  }

  /**
   * Get all alert rules for a user
   */
  async getAlertRulesByUser(userId: string): Promise<AlertRuleDocument[]> {
    return this.alertRuleModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Get all alert rules for a vehicle
   */
  async getAlertRulesByVehicle(vehicleId: string): Promise<AlertRuleDocument[]> {
    return this.alertRuleModel.find({ vehicleId, enabled: true }).exec();
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(userId: string, alertRuleId: string): Promise<boolean> {
    const result = await this.alertRuleModel.deleteOne({
      _id: new Types.ObjectId(alertRuleId),
      userId: new Types.ObjectId(userId),
    }).exec();

    return result.deletedCount > 0;
  }

  /**
   * Get alert events for a user
   */
  async getAlertEvents(userId: string, limit: number = 50): Promise<AlertEventDocument[]> {
    const alertRules = await this.alertRuleModel
      .find({ userId: new Types.ObjectId(userId) })
      .select('_id')
      .exec();

    const ruleIds = alertRules.map((rule) => rule._id);

    return this.alertEventModel
      .find({ alertRuleId: { $in: ruleIds } })
      .sort({ triggeredAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Get recent alert event for a specific rule (for deduplication)
   */
  async getLastAlertEvent(alertRuleId: string): Promise<AlertEventDocument | null> {
    return this.alertEventModel
      .findOne({ alertRuleId: new Types.ObjectId(alertRuleId) })
      .sort({ triggeredAt: -1 })
      .exec();
  }

  /**
   * Create an alert event
   */
  private async createAlertEvent(alertRule: AlertRuleDocument, value: string): Promise<AlertEventDocument> {
    const alertEvent = new this.alertEventModel({
      alertRuleId: alertRule._id,
      vehicleId: alertRule.vehicleId,
      type: alertRule.type,
      value,
    });

    return alertEvent.save();
  }

  /**
   * Check if alert should be triggered (deduplication)
   */
  private shouldTriggerAlert(alertRuleId: string): boolean {
    const lastTrigger = this.lastAlertTimes.get(alertRuleId);
    if (!lastTrigger) return true;

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastTrigger < fiveMinutesAgo;
  }

  /**
   * Evaluate LOW_BATTERY alert
   */
  private evaluateLowBattery(status: VehicleStatus, threshold: number): boolean {
    if (!status.charge_state?.battery_level) return false;
    return status.charge_state.battery_level < threshold;
  }

  /**
   * Evaluate CHARGING_STOPPED alert
   * Note: This requires tracking previous state - simplified for now
   */
  private evaluateChargingStopped(status: VehicleStatus): boolean {
    // Check if was charging and now disconnected
    // This is a simplified check - in production you'd track state transitions
    return status.charge_state?.charging_state === 'Disconnected';
  }

  /**
   * Evaluate VEHICLE_ASLEEP_TOO_LONG alert
   */
  private async evaluateVehicleAsleepTooLong(
    alertRule: AlertRuleDocument,
    status: VehicleStatus,
  ): Promise<boolean> {
    if (status.state !== 'asleep') return false;

    const lastEvent = await this.getLastAlertEvent(alertRule._id.toString());
    if (!lastEvent) {
      // First time asleep - store the timestamp when we first noticed
      return true;
    }

    // Check if asleep for longer than threshold
    // Note: triggeredAt is added by Mongoose timestamps
    const lastEventAny = lastEvent as any;
    const asleepDuration = Date.now() - lastEventAny.triggeredAt.getTime();
    const thresholdMs = alertRule.sleepThresholdMinutes * 60 * 1000;
    return asleepDuration > thresholdMs;
  }

  /**
   * Background job: Check all enabled alert rules
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async evaluateAlertRules(): Promise<void> {
    this.logger.log('Starting alert rule evaluation...');

    try {
      // Get all enabled alert rules
      const alertRules = await this.alertRuleModel.find({ enabled: true }).exec();

      this.logger.log(`Evaluating ${alertRules.length} alert rules`);

      for (const alertRule of alertRules) {
        try {
          await this.evaluateSingleRule(alertRule);
        } catch (error) {
          this.logger.error(
            `Error evaluating alert rule ${alertRule._id}: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Error in alert evaluation job: ${error.message}`);
    }
  }

  /**
   * Evaluate a single alert rule
   */
  async evaluateSingleRule(alertRule: AlertRuleDocument): Promise<boolean | null> {
    const userId = alertRule.userId.toString();

    try {
      // Get vehicle status via vehiclesService (NOT directly from Tesla API)
      const status = await this.vehiclesService.findOneById(alertRule.vehicleId);

      if (!status) {
        this.logger.warn(`Vehicle ${alertRule.vehicleId} not found`);
        return null;
      }

      // Check deduplication window
      if (!this.shouldTriggerAlert(alertRule._id.toString())) {
        this.logger.debug(
          `Alert ${alertRule._id} suppressed (within 5-min window)`,
        );
        return false;
      }

      // Evaluate based on alert type
      let shouldTrigger = false;
      let triggerValue = '';

      switch (alertRule.type) {
        case AlertType.LOW_BATTERY:
          shouldTrigger = this.evaluateLowBattery(
            status as VehicleStatus,
            alertRule.threshold,
          );
          if (shouldTrigger) {
            triggerValue = `Battery level: ${status.charge_state?.battery_level}% (threshold: ${alertRule.threshold}%)`;
          }
          break;

        case AlertType.CHARGING_STOPPED:
          shouldTrigger = this.evaluateChargingStopped(status as VehicleStatus);
          if (shouldTrigger) {
            triggerValue = `Charging state: ${status.charge_state?.charging_state}`;
          }
          break;

        case AlertType.VEHICLE_ASLEEP_TOO_LONG:
          shouldTrigger = await this.evaluateVehicleAsleepTooLong(
            alertRule,
            status as VehicleStatus,
          );
          if (shouldTrigger) {
            triggerValue = `Vehicle has been asleep for ${alertRule.sleepThresholdMinutes} minutes`;
          }
          break;
      }

      // Create alert event if triggered
      if (shouldTrigger) {
        await this.createAlertEvent(alertRule, triggerValue);
        this.lastAlertTimes.set(alertRule._id.toString(), new Date());
        this.logger.log(
          `Alert triggered: ${alertRule.type} for vehicle ${alertRule.vehicleId}`,
        );
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error(
        `Failed to evaluate alert rule ${alertRule._id}: ${error.message}`,
      );
      throw error;
    }
  }
}
