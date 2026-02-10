// src/api/v1/v1.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { AlertsModule } from './alerts/alerts.module';

@Module({
  imports: [AuthModule, VehiclesModule, AlertsModule],
})
export class V1Module {}
