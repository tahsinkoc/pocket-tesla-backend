// src/api/v1/vehicles/schemas/vehicle.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VehicleDocument = Vehicle & Document;

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({ required: true, unique: true })
  tesla_vehicle_id: string;

  @Prop()
  vin: string;

  @Prop()
  display_name: string;

  @Prop({ enum: ['online', 'offline'], default: 'offline' })
  state: string;

  @Prop()
  model: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop()
  last_seen_at: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
