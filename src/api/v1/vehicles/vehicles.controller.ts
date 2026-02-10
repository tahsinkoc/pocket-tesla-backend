// src/api/v1/vehicles/vehicles.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getVehicles(@Req() req) {
    const userId = req.user.sub;
    return this.vehiclesService.findAllByUser(userId);
  }

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  async getVehicleStatus(@Param('id') id: string) {
    return this.vehiclesService.findOneById(id);
  }

  @Post(':id/commands')
  @UseGuards(JwtAuthGuard)
  async sendCommand(@Param('id') id: string, @Body() body: { command: string }) {
    // TODO: Implement Tesla API command execution
    return { message: `Command '${body.command}' sent to vehicle ${id}` };
  }
}
