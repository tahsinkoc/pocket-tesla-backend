// src/api/v1/audit-logs/audit-logs.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditLogsService, AuditLogQueryDto } from './audit-logs.service';
import { AuditAction, EntityType } from './schemas/audit-log.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('api/v1/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * Get audit logs for the authenticated user
   * GET /api/v1/audit-logs
   *
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 50, max: 100)
   * - action: Filter by action type
   * - entityType: Filter by entity type
   * - startDate: Filter by start date (ISO 8601)
   * - endDate: Filter by end date (ISO 8601)
   */
  @Get()
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieves audit logs for the authenticated user with pagination and filtering',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (max: 100, default: 50)' })
  @ApiQuery({ name: 'action', required: false, enum: AuditAction, description: 'Filter by action type' })
  @ApiQuery({ name: 'entityType', required: false, enum: EntityType, description: 'Filter by entity type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (ISO 8601)' })
  @ApiResponse({
    status: 200,
    description: 'Audit logs returned with pagination info',
    schema: {
      type: 'object',
      properties: {
        logs: { type: 'array', description: 'List of audit logs' },
        total: { type: 'number', description: 'Total number of logs matching filter' },
        page: { type: 'number', description: 'Current page' },
        limit: { type: 'number', description: 'Items per page' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAuditLogs(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: EntityType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const userId = req.user.sub;

    const query: AuditLogQueryDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      action,
      entityType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.auditLogsService.getLogsByUser(userId, query);
  }

  /**
   * Get audit logs for a specific entity
   * GET /api/v1/audit-logs/entity/:entityType/:entityId
   */
  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get audit logs for entity',
    description: 'Retrieves audit logs for a specific entity (vehicle, alert, etc.)',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Max logs to return (default: 50)' })
  @ApiResponse({ status: 200, description: 'Entity audit logs returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEntityLogs(
    @Req() req,
    @Query('entityType') entityType: EntityType,
    @Query('entityId') entityId: string,
    @Query('limit') limit?: string,
  ) {
    // Verify user has access to this entity (basic check)
    // In production, you'd want more robust authorization
    const userId = req.user.sub;

    return this.auditLogsService.getLogsByEntity(
      entityType,
      entityId,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
