// src/api/v1/audit-logs/schemas/audit-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  // Auth actions
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  TESLA_CONNECT = 'TESLA_CONNECT',
  TESLA_DISCONNECT = 'TESLA_DISCONNECT',

  // Vehicle actions
  VEHICLE_COMMAND = 'VEHICLE_COMMAND',
  VEHICLE_STATUS_REQUEST = 'VEHICLE_STATUS_REQUEST',

  // Alert actions
  ALERT_RULE_CREATED = 'ALERT_RULE_CREATED',
  ALERT_RULE_DELETED = 'ALERT_RULE_DELETED',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  ALERT_DISABLED = 'ALERT_DISABLED',
  ALERT_ENABLED = 'ALERT_ENABLED',

  // System actions
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
}

export enum EntityType {
  USER = 'user',
  VEHICLE = 'vehicle',
  ALERT = 'alert',
  AUTH = 'auth',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: AuditAction })
  action: AuditAction;

  @Prop({ required: true, enum: EntityType })
  entityType: EntityType;

  @Prop()
  entityId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ userId: 1, action: 1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ createdAt: -1 });
