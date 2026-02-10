// src/api/v1/v1.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [AuthModule, VehiclesModule, AlertsModule, AuditLogsModule],
})
export class V1Module {}
