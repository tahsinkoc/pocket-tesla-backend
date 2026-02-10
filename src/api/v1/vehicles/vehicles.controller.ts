// src/api/v1/vehicles/vehicles.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async getVehicles(@Req() req) {
    const userId = req.user.sub;
    return this.vehiclesService.findAllByUser(userId);
  }

  @Get(':id/status')
  async getVehicleStatus(@Param('id') id: string) {
    return this.vehiclesService.findOneById(id);
  }

  @Post(':id/commands')
  @HttpCode(HttpStatus.OK)
  async sendCommand(
    @Param('id') id: string,
    @Body() body: { command: string; params?: Record<string, any> },
    @Req() req,
  ) {
    const userId = req.user.sub;
    return this.vehiclesService.sendCommand(userId, id, body.command, body.params);
  }
}
