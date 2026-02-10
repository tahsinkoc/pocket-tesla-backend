// src/api/v1/alerts/schemas/alert-rule.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AlertRuleDocument = AlertRule & Document;

export enum AlertType {
  LOW_BATTERY = 'LOW_BATTERY',
  CHARGING_STOPPED = 'CHARGING_STOPPED',
  VEHICLE_ASLEEP_TOO_LONG = 'VEHICLE_ASLEEP_TOO_LONG',
}

@Schema({ timestamps: true })
export class AlertRule {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  vehicleId: string;

  @Prop({ required: true, enum: AlertType })
  type: AlertType;

  @Prop({ default: 20 })
  threshold: number;

  @Prop({ default: 30 })
  sleepThresholdMinutes: number;

  @Prop({ default: true })
  enabled: boolean;
}

export const AlertRuleSchema = SchemaFactory.createForClass(AlertRule);

// Index for efficient querying by user and enabled status
AlertRuleSchema.index({ userId: 1, enabled: 1 });
AlertRuleSchema.index({ vehicleId: 1, enabled: 1 });
