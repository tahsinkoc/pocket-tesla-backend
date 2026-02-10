// src/api/v1/vehicles/vehicles.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle, VehicleDocument } from './schemas/vehicle.schema';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name)
    private vehicleModel: Model<VehicleDocument>,
  ) {}

  async findAllByUser(userId: string): Promise<Vehicle[]> {
    return this.vehicleModel.find({ user_id: new Types.ObjectId(userId) }).exec();
  }

  async findOneById(id: string): Promise<Vehicle | null> {
    return this.vehicleModel.findById(id).exec();
  }

  async findOneByTeslaId(teslaVehicleId: string): Promise<Vehicle | null> {
    return this.vehicleModel.findOne({ tesla_vehicle_id: teslaVehicleId }).exec();
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
}
