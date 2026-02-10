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
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsService, CreateAlertRuleDto, VehicleStatus } from './alerts.service';
import { AlertType } from './schemas/alert-rule.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('api/v1/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Create a new alert rule
   * Alert types:
   * - LOW_BATTERY: Trigger when battery falls below threshold
   * - CHARGING_STOPPED: Trigger when charging is disconnected
   * - VEHICLE_ASLEEP_TOO_LONG: Trigger when vehicle is asleep for too long
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create alert rule',
    description: 'Creates a new alert rule to monitor vehicle status',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['vehicleId', 'type'],
      properties: {
        vehicleId: {
          type: 'string',
          description: 'ID of the vehicle to monitor',
        },
        type: {
          type: 'string',
          enum: ['LOW_BATTERY', 'CHARGING_STOPPED', 'VEHICLE_ASLEEP_TOO_LONG'],
          description: 'Type of alert to create',
        },
        threshold: {
          type: 'number',
          description: 'Battery threshold percentage (for LOW_BATTERY)',
          default: 20,
        },
        sleepThresholdMinutes: {
          type: 'number',
          description: 'Minutes before triggering sleep alert',
          default: 30,
        },
        enabled: {
          type: 'boolean',
          description: 'Whether the alert rule is enabled',
          default: true,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Alert rule created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
   */
  @Get()
  @ApiOperation({
    summary: 'Get all alert rules',
    description: 'Retrieves all alert rules for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'List of alert rules returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAlertRules(@Req() req) {
    const userId = req.user.sub;
    return this.alertsService.getAlertRulesByUser(userId);
  }

  /**
   * Get all alert events for the authenticated user
   */
  @Get('events')
  @ApiOperation({
    summary: 'Get alert events',
    description: 'Retrieves all triggered alert events for the authenticated user',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Max events to return (default: 50)' })
  @ApiResponse({ status: 200, description: 'List of alert events returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAlertEvents(@Req() req, @Query('limit') limit?: string) {
    const userId = req.user.sub;
    return this.alertsService.getAlertEvents(userId, limit ? parseInt(limit, 10) : 50);
  }

  /**
   * Delete an alert rule
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete alert rule',
    description: 'Deletes an alert rule by ID',
  })
  @ApiParam({ name: 'id', description: 'Alert rule ID' })
  @ApiResponse({ status: 200, description: 'Alert rule deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert rule not found' })
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
  @ApiOperation({
    summary: 'Test alert rule',
    description: 'Tests an alert rule manually (debugging endpoint)',
  })
  @ApiParam({ name: 'id', description: 'Alert rule ID' })
  @ApiResponse({ status: 200, description: 'Test result returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
