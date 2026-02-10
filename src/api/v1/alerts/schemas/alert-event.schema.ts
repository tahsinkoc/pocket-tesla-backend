// src/api/v1/alerts/schemas/alert-event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AlertType } from './alert-rule.schema';

export type AlertEventDocument = AlertEvent & Document;

@Schema({ timestamps: true })
export class AlertEvent {
  @Prop({ type: Types.ObjectId, ref: 'AlertRule', required: true })
  alertRuleId: Types.ObjectId;

  @Prop({ required: true })
  vehicleId: string;

  @Prop({ required: true, enum: AlertType })
  type: AlertType;

  @Prop({ required: true })
  value: string;

  @Prop({ default: false })
  acknowledged: boolean;

  @Prop()
  acknowledgedAt: Date;

  @Prop()
  acknowledgedBy: string;
}

export const AlertEventSchema = SchemaFactory.createForClass(AlertEvent);

// Index for efficient querying by vehicle and time
AlertEventSchema.index({ vehicleId: 1, triggeredAt: -1 });
AlertEventSchema.index({ alertRuleId: 1, triggeredAt: -1 });
