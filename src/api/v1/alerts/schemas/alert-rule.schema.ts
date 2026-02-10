// src/api/v1/alerts/schemas/alert-rule.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type AlertRuleDocument = AlertRule & Document;

export enum AlertType {
  LOW_BATTERY = 'LOW_BATTERY',
  CHARGING_STOPPED = 'CHARGING_STOPPED',
  VEHICLE_ASLEEP_TOO_LONG = 'VEHICLE_ASLEEP_TOO_LONG',
}

@Schema({ timestamps: true })
export class AlertRule {
  @ApiProperty({ description: 'User ID who owns this alert rule', type: String })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Vehicle ID to monitor', type: String })
  @Prop({ required: true })
  vehicleId: string;

  @ApiProperty({
    description: 'Type of alert',
    enum: AlertType,
    example: AlertType.LOW_BATTERY,
  })
  @Prop({ required: true, enum: AlertType })
  type: AlertType;

  @ApiProperty({
    description: 'Battery threshold percentage for LOW_BATTERY alerts',
    example: 20,
  })
  @Prop({ default: 20 })
  threshold: number;

  @ApiProperty({
    description: 'Minutes before triggering VEHICLE_ASLEEP_TOO_LONG alert',
    example: 30,
  })
  @Prop({ default: 30 })
  sleepThresholdMinutes: number;

  @ApiProperty({
    description: 'Whether the alert rule is enabled',
    example: true,
  })
  @Prop({ default: true })
  enabled: boolean;
}

export const AlertRuleSchema = SchemaFactory.createForClass(AlertRule);

// Index for efficient querying by user and enabled status
AlertRuleSchema.index({ userId: 1, enabled: 1 });
AlertRuleSchema.index({ vehicleId: 1, enabled: 1 });
