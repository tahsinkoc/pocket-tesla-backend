// src/api/v1/vehicles/tesla-api.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';
import { TeslaTokenService } from './tesla-token.service';
import { UsersService } from '../users/user.service';

@Injectable()
export class TeslaApiService {
  private readonly baseUrl = 'https://fleet-api.prd.eu.vn.cloud.tesla.com';
  private readonly localCommandUrl = 'https://localhost:4443';

  constructor(
    private readonly tokenService: TeslaTokenService,
    private readonly usersService: UsersService,
  ) { }

  private isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= new Date(expiresAt.getTime() - 5 * 60 * 1000); // 5 min buffer
  }

  private async makeRequest<T>(
    method: 'get' | 'post',
    url: string,
    userId: string,
    data?: any,
    retryAfterRefresh: boolean = true,
  ): Promise<T> {
    // Get user with Tesla tokens
    const user = await this.usersService.findById(userId);
    if (!user?.teslaAccessToken || !user?.teslaRefreshToken) {
      throw new HttpException('Tesla account not linked', HttpStatus.UNAUTHORIZED);
    }

    // Check if token is expired
    const needsRefresh = user.teslaTokenExpiresAt && this.isTokenExpired(user.teslaTokenExpiresAt);

    // Refresh token if needed
    if (needsRefresh) {
      const tokens = await this.tokenService.refreshTokens(user.teslaRefreshToken);
      await this.usersService.updateTeslaTokens(userId, tokens);
      user.teslaAccessToken = tokens.accessToken;
    }

    try {
      const config: any = {
        method,
        url: `${this.baseUrl}${url}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.teslaAccessToken}`,
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data as T;
    } catch (error) {
      // If 401 and haven't retried yet, refresh token and retry
      if (error.response?.status === 401 && retryAfterRefresh && !needsRefresh) {
        const tokens = await this.tokenService.refreshTokens(user.teslaRefreshToken);
        await this.usersService.updateTeslaTokens(userId, tokens);
        return this.makeRequest(method, url, userId, data, false);
      }

      throw new HttpException(
        error.response?.data?.error || error.response?.data?.error_description || 'Tesla API request failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async makeCommandRequest<T>(
    method: 'get' | 'post',
    url: string,
    userId: string,
    data?: any,
    retryAfterRefresh: boolean = true,
  ): Promise<T> {
    // Get user with Tesla tokens
    const user = await this.usersService.findById(userId);
    if (!user?.teslaAccessToken || !user?.teslaRefreshToken) {
      throw new HttpException('Tesla account not linked', HttpStatus.UNAUTHORIZED);
    }

    // Check if token is expired
    const needsRefresh = user.teslaTokenExpiresAt && this.isTokenExpired(user.teslaTokenExpiresAt);

    // Refresh token if needed
    if (needsRefresh) {
      const tokens = await this.tokenService.refreshTokens(user.teslaRefreshToken);
      await this.usersService.updateTeslaTokens(userId, tokens);
      user.teslaAccessToken = tokens.accessToken;
    }

    try {
      const config: any = {
        method,
        url: `${this.localCommandUrl}${url}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.teslaAccessToken}`,
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // Allow self-signed certificates for local endpoint
        }),
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data as T;
    } catch (error) {
      // If 401 and haven't retried yet, refresh token and retry
      if (error.response?.status === 401 && retryAfterRefresh && !needsRefresh) {
        const tokens = await this.tokenService.refreshTokens(user.teslaRefreshToken);
        await this.usersService.updateTeslaTokens(userId, tokens);
        return this.makeCommandRequest(method, url, userId, data, false);
      }

      throw new HttpException(
        error.response?.data?.error || error.response?.data?.error_description || 'Tesla API request failed',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getVehicles(userId: string): Promise<any> {
    return this.makeRequest('get', '/api/1/vehicles', userId);
  }

  async getVehicleData(userId: string, vehicleId: string | number): Promise<any> {
    return this.makeRequest('get', `/api/1/vehicles/${vehicleId}/vehicle_data`, userId);
  }

  async wakeUpVehicle(userId: string, vehicleId: string | number): Promise<any> {
    return this.makeRequest('post', `/api/1/vehicles/${vehicleId}/wake_up`, userId);
  }

  async sendCommand(
    userId: string,
    vehicleId: string | number,
    command: string,
    params?: Record<string, any>,
  ): Promise<any> {
    // Use local endpoint for vehicle commands
    const url = `/api/1/vehicles/${vehicleId}/command/${command}`;
    return this.makeCommandRequest('post', url, userId, params || {});
  }
}
