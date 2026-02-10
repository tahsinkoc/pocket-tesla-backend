// src/api/v1/v1.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
  imports: [AuthModule, VehiclesModule],
})
export class V1Module {}
