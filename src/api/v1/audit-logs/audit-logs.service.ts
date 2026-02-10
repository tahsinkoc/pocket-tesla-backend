// src/api/v1/audit-logs/audit-logs.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AuditLog,
  AuditLogDocument,
  AuditAction,
  EntityType,
} from './schemas/audit-log.schema';

export interface CreateAuditLogDto {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQueryDto {
  page?: number;
  limit?: number;
  action?: AuditAction;
  entityType?: EntityType;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Create an audit log entry asynchronously
   * This method NEVER throws - logging failures must not block user actions
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    // Fire and forget - don't await
    this.createLogEntry(dto).catch((error) => {
      // Log error but don't throw - audit logging must not fail user actions
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack,
      );
    });
  }

  /**
   * Internal method to create the log entry
   * Separated for testing and error handling
   */
  private async createLogEntry(dto: CreateAuditLogDto): Promise<AuditLogDocument> {
    const auditLog = new this.auditLogModel({
      userId: new Types.ObjectId(dto.userId),
      action: dto.action,
      entityType: dto.entityType,
      entityId: dto.entityId,
      metadata: dto.metadata || {},
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    return auditLog.save();
  }

  /**
   * Get audit logs for a user with pagination and filtering
   */
  async getLogsByUser(
    userId: string,
    query: AuditLogQueryDto = {},
  ): Promise<{ logs: AuditLogDocument[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {
      userId: new Types.ObjectId(userId),
    };

    if (query.action) {
      filter.action = query.action;
    }

    if (query.entityType) {
      filter.entityType = query.entityType;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    // Execute queries in parallel
    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments(filter).exec(),
    ]);

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  /**
   * Get audit logs for an entity
   */
  async getLogsByEntity(
    entityType: EntityType,
    entityId: string,
    limit: number = 50,
  ): Promise<AuditLogDocument[]> {
    return this.auditLogModel
      .find({
        entityType,
        entityId,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  /**
   * Log helper methods for common actions
   */
  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.LOGIN,
      entityType: EntityType.AUTH,
      metadata: { timestamp: new Date().toISOString() },
      ipAddress,
      userAgent,
    });
  }

  async logTeslaConnect(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.TESLA_CONNECT,
      entityType: EntityType.AUTH,
      ipAddress,
      userAgent,
    });
  }

  async logTeslaDisconnect(
    userId: string,
    reason?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.TESLA_DISCONNECT,
      entityType: EntityType.AUTH,
      metadata: { reason },
      ipAddress,
      userAgent,
    });
  }

  async logVehicleCommand(
    userId: string,
    vehicleId: string,
    command: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.VEHICLE_COMMAND,
      entityType: EntityType.VEHICLE,
      entityId: vehicleId,
      metadata: {
        command,
        success,
        timestamp: new Date().toISOString(),
      },
      ipAddress,
      userAgent,
    });
  }

  async logAlertRuleCreated(
    userId: string,
    alertRuleId: string,
    alertType: string,
    vehicleId: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.ALERT_RULE_CREATED,
      entityType: EntityType.ALERT,
      entityId: alertRuleId,
      metadata: { alertType, vehicleId },
    });
  }

  async logAlertRuleDeleted(
    userId: string,
    alertRuleId: string,
    alertType: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.ALERT_RULE_DELETED,
      entityType: EntityType.ALERT,
      entityId: alertRuleId,
      metadata: { alertType },
    });
  }

  async logAlertTriggered(
    userId: string,
    alertRuleId: string,
    alertType: string,
    vehicleId: string,
    triggerValue: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditAction.ALERT_TRIGGERED,
      entityType: EntityType.ALERT,
      entityId: alertRuleId,
      metadata: {
        alertType,
        vehicleId,
        triggerValue,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
