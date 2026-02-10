// src/api/v1/alerts/alerts.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsService, CreateAlertRuleDto, VehicleStatus } from './alerts.service';
import { AlertType } from './schemas/alert-rule.schema';

@Controller('api/v1/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Create a new alert rule
   * POST /api/v1/alerts
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAlertRule(
    @Body()
    body: {
      vehicleId: string;
      type: AlertType;
      threshold?: number;
      sleepThresholdMinutes?: number;
      enabled?: boolean;
    },
    @Req() req,
  ) {
    const userId = req.user.sub;
    const dto: CreateAlertRuleDto = {
      vehicleId: body.vehicleId,
      type: body.type,
      threshold: body.threshold,
      sleepThresholdMinutes: body.sleepThresholdMinutes,
      enabled: body.enabled,
    };

    return this.alertsService.createAlertRule(userId, dto);
  }

  /**
   * Get all alert rules for the authenticated user
   * GET /api/v1/alerts
   */
  @Get()
  async getAlertRules(@Req() req) {
    const userId = req.user.sub;
    return this.alertsService.getAlertRulesByUser(userId);
  }

  /**
   * Get all alert events for the authenticated user
   * GET /api/v1/alerts/events
   */
  @Get('events')
  async getAlertEvents(@Req() req) {
    const userId = req.user.sub;
    return this.alertsService.getAlertEvents(userId);
  }

  /**
   * Delete an alert rule
   * DELETE /api/v1/alerts/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteAlertRule(@Param('id') id: string, @Req() req) {
    const userId = req.user.sub;
    const deleted = await this.alertsService.deleteAlertRule(userId, id);

    if (!deleted) {
      return { success: false, message: 'Alert rule not found' };
    }

    return { success: true, message: 'Alert rule deleted' };
  }

  /**
   * Test an alert rule manually
   * POST /api/v1/alerts/:id/test
   * Useful for debugging alert conditions
   */
  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  async testAlertRule(
    @Param('id') id: string,
    @Body() body: { vehicleStatus: VehicleStatus },
    @Req() req,
  ) {
    // This is a debugging endpoint - in production you might want to remove it
    return {
      tested: true,
      message: 'Alert rule test endpoint - for debugging only',
    };
  }
}
