// src/api/v1/vehicles/vehicles.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('api/v1/vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  /**
   * Get all vehicles for the authenticated user
   * Fetches vehicles from Tesla API
   */
  @Get()
  @ApiOperation({
    summary: 'Get all user vehicles',
    description: 'Retrieves all Tesla vehicles associated with the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'List of vehicles returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getVehicles(@Req() req) {
    const userId = req.user.sub;
    return this.vehiclesService.findAllByUser(userId);
  }

  /**
   * Get specific vehicle status and details
   */
  @Get(':id/status')
  @ApiOperation({
    summary: 'Get vehicle status',
    description: 'Retrieves detailed status and information for a specific vehicle',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async getVehicleStatus(@Param('id') id: string) {
    return this.vehiclesService.findOneById(id);
  }

  /**
   * Send command to vehicle
   * Commands include: wake_up, honk, flash, lock, unlock, etc.
   */
  @Post(':id/commands')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send vehicle command',
    description: 'Sends a command to the vehicle (wake_up, honk, flash, lock, unlock, set_charge_limit, etc.)',
  })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Command to execute',
          example: 'wake_up',
        },
        params: {
          type: 'object',
          description: 'Optional command parameters',
          example: { percent: 80 },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Command executed successfully' })
  @ApiResponse({ status: 400, description: 'Command failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async sendCommand(
    @Param('id') id: string,
    @Body() body: { command: string; params?: Record<string, any> },
    @Req() req,
  ) {
    const userId = req.user.sub;
    return this.vehiclesService.sendCommand(userId, id, body.command, body.params);
  }
}
