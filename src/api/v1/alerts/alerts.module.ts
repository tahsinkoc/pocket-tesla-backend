// src/api/v1/alerts/alerts.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AlertRule, AlertRuleSchema } from './schemas/alert-rule.schema';
import { AlertEvent, AlertEventSchema } from './schemas/alert-event.schema';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AlertRule.name, schema: AlertRuleSchema },
      { name: AlertEvent.name, schema: AlertEventSchema },
    ]),
    VehiclesModule, // Required for vehiclesService.findOneById()
  ],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
