// src/api/v1/alerts/schemas/alert-event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AlertType } from './alert-rule.schema';
import { ApiProperty } from '@nestjs/swagger';

export type AlertEventDocument = AlertEvent & Document;

@Schema({ timestamps: true })
export class AlertEvent {
  @ApiProperty({ description: 'Related alert rule ID', type: String })
  @Prop({ type: Types.ObjectId, ref: 'AlertRule', required: true })
  alertRuleId: Types.ObjectId;

  @ApiProperty({ description: 'Vehicle ID that triggered the alert', type: String })
  @Prop({ required: true })
  vehicleId: string;

  @ApiProperty({ description: 'Type of alert', enum: AlertType, example: AlertType.LOW_BATTERY })
  @Prop({ required: true, enum: AlertType })
  type: AlertType;

  @ApiProperty({ description: 'Value that triggered the alert', example: '15' })
  @Prop({ required: true })
  value: string;

  @ApiProperty({ description: 'Whether the alert has been acknowledged', example: false })
  @Prop({ default: false })
  acknowledged: boolean;

  @ApiProperty({ description: 'When the alert was acknowledged', required: false })
  @Prop()
  acknowledgedAt: Date;

  @ApiProperty({ description: 'User ID who acknowledged the alert', required: false })
  @Prop()
  acknowledgedBy: string;

  @ApiProperty({ description: 'When the alert was triggered' })
  triggeredAt: Date;
}

export const AlertEventSchema = SchemaFactory.createForClass(AlertEvent);

// Index for efficient querying by vehicle and time
AlertEventSchema.index({ vehicleId: 1, triggeredAt: -1 });
AlertEventSchema.index({ alertRuleId: 1, triggeredAt: -1 });
