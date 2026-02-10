// src/api/v1/vehicles/tesla-token.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

export interface TeslaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class TeslaTokenService {
  private readonly tokenUrl = 'https://auth.tesla.com/oauth2/v3/token';

  async refreshTokens(refreshToken: string): Promise<TeslaTokens> {
    try {
      const response = await axios.post(this.tokenUrl, {
        grant_type: 'refresh_token',
        client_id: 'ownerapi',
        refresh_token: refreshToken,
      });

      const data = response.data as {
        access_token: string;
        refresh_token?: string;
        expires_in: number;
      };

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    } catch (error) {
      throw new HttpException(
        error.response?.data?.error_description || 'Failed to refresh Tesla tokens',
        error.response?.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
