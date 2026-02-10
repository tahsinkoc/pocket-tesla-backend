// src/api/v1/vehicles/vehicles.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';
import { TeslaApiService } from './tesla-api.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<VehicleDocument>,
    private readonly teslaApiService: TeslaApiService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async findAllByUser(userId: string): Promise<any> {
    const response = await this.teslaApiService.getVehicles(userId);
    return response.response;
  }

  async findOneById(id: string): Promise<any> {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new HttpException('Vehicle not found', HttpStatus.NOT_FOUND);
    }

    const userId = vehicle.user_id.toString();
    const response = await this.teslaApiService.getVehicleData(userId, vehicle.tesla_vehicle_id);

    // Check if vehicle is asleep
    if (response.response?.state === 'asleep') {
      return {
        state: 'asleep',
        vehicle_id: vehicle.tesla_vehicle_id,
        display_name: vehicle.display_name,
        vin: vehicle.vin,
      };
    }

    return response.response;
  }

  async findOneByTeslaId(teslaVehicleId: string | number): Promise<Vehicle | null> {
    const id = teslaVehicleId.toString();
    return this.vehicleModel.findOne({ tesla_vehicle_id: id }).exec();
  }

  async create(data: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = new this.vehicleModel(data);
    return vehicle.save();
  }

  async updateStatus(id: string, state: string, lastSeenAt?: Date): Promise<Vehicle | null> {
    return this.vehicleModel.findByIdAndUpdate(
      id,
      { state, last_seen_at: lastSeenAt || new Date() },
      { new: true },
    ).exec();
  }

  async delete(id: string): Promise<Vehicle | null> {
    return this.vehicleModel.findByIdAndDelete(id).exec();
  }

  async sendCommand(
    userId: string,
    vehicleId: string,
    command: string,
    params?: Record<any, any>,
  ): Promise<any> {
    const vehicle = await this.vehicleModel.findById(vehicleId).exec();
    if (!vehicle) {
      throw new HttpException('Vehicle not found', HttpStatus.NOT_FOUND);
    }

    let success = false;
    let resultData: any;

    try {
      // Check vehicle state first
      const vehicleData = await this.teslaApiService.getVehicleData(userId, vehicle.tesla_vehicle_id);

      // Wake up if asleep
      if (vehicleData.response?.state === 'asleep') {
        await this.teslaApiService.wakeUpVehicle(userId, vehicle.tesla_vehicle_id);
        // Wait 5 seconds for vehicle to wake up
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Send command based on type
      let result;
      switch (command) {
        case 'set_charge_limit':
          result = await this.teslaApiService.sendCommand(
            userId,
            vehicle.tesla_vehicle_id,
            'set_charge_limit',
            { percent: params?.percent || 80 },
          );
          break;
        default:
          result = await this.teslaApiService.sendCommand(
            userId,
            vehicle.tesla_vehicle_id,
            command,
            params,
          );
      }

      resultData = result;
      success = result?.response?.result === true;
    } catch (error) {
      success = false;
      resultData = { error: error.message };
    }

    // Log vehicle command (async, non-blocking)
    this.auditLogsService.logVehicleCommand(
      userId,
      vehicle.tesla_vehicle_id,
      command,
      success,
    );

    if (!success && resultData?.error) {
      throw new HttpException(resultData.error, HttpStatus.BAD_REQUEST);
    }

    return resultData?.response;
  }
}
