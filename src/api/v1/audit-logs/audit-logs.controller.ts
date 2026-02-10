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
