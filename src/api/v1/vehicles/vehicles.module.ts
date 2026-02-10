// src/api/v1/vehicles/vehicles.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { TeslaApiService } from './tesla-api.service';
import { TeslaTokenService } from './tesla-token.service';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }]),
    UsersModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService, TeslaApiService, TeslaTokenService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
