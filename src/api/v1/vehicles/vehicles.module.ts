// src/api/v1/vehicles/vehicles.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { UsersModule } from '../users/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vehicle.name, schema: VehicleSchema }]),
    UsersModule,
  ],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
