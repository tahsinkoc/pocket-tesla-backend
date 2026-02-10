// src/api/v1/vehicles/schemas/vehicle.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type VehicleDocument = Vehicle & Document;

@Schema({ timestamps: true })
export class Vehicle {
  @ApiProperty({ description: 'Tesla vehicle ID', example: '1234567890' })
  @Prop({ required: true, unique: true })
  tesla_vehicle_id: string;

  @ApiProperty({ description: 'Vehicle Identification Number', required: false, example: '5YJ3E1EA1JF000001' })
  @Prop()
  vin: string;

  @ApiProperty({ description: 'Vehicle display name', required: false, example: 'My Tesla' })
  @Prop()
  display_name: string;

  @ApiProperty({ description: 'Vehicle state', enum: ['online', 'offline'], example: 'online' })
  @Prop({ enum: ['online', 'offline'], default: 'offline' })
  state: string;

  @ApiProperty({ description: 'Vehicle model', required: false, example: 'Model 3' })
  @Prop()
  model: string;

  @ApiProperty({ description: 'Owner user ID', type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @ApiProperty({ description: 'Last time vehicle was seen', required: false })
  @Prop()
  last_seen_at: Date;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
