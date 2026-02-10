// src/api/v1/v1.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AuthGuardsModule } from './auth/guards/auth-guards.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    AuthModule,
    AuthGuardsModule, // Provides JwtAuthGuard globally
    VehiclesModule,
    AlertsModule,
    AuditLogsModule, // Global - exports AuditLogsService
  ],
})
export class V1Module {}
