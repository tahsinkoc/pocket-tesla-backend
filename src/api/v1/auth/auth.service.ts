// src/api/v1/auth/auth.service.ts
import { Injectable, UnauthorizedException, Req, Res, Query, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { compare, hash } from 'bcrypt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async saveTeslaTokens(
    userId: string,
    tokens: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    },
  ) {
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000,
    );

    return this.userModel.findByIdAndUpdate(
      userId,
      {
        teslaAccessToken: tokens.access_token,
        teslaRefreshToken: tokens.refresh_token,
        teslaTokenExpiresAt: expiresAt,
        teslaState: null, // cleanup
      },
      { new: true },
    );
  }

  private async exchangeCodeForToken(code: string) {
    const response = await fetch(
      'https://auth.tesla.com/oauth2/v3/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.TESLA_CLIENT_ID || '',
          client_secret: process.env.TESLA_CLIENT_SECRET || '',
          redirect_uri: process.env.TESLA_REDIRECT_URI || '',
          code,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  async login(dto: LoginDto, req?: any) {
    try {
      const user = await this.userModel.findOne({ email: dto.email }).exec();

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await compare(dto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { sub: user._id, email: user.email };
      const token = this.jwtService.sign(payload);

      // Log login event (async, non-blocking)
      this.auditLogsService.logLogin(
        user._id.toString(),
        req?.headers?.['x-forwarded-for'] || req?.ip,
        req?.headers?.['user-agent'],
      );

      return {
        token,
        user: {
          id: user._id,
          email: user.email,
          fullname: user.fullname,
          phone: user.phone,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(dto: RegisterDto) {
    try {
      const { email, password, phone, fullname } = dto;

      const isUserExist = await this.userModel.findOne({ email }).exec();

      if (isUserExist) {
        throw new UnauthorizedException('User already exists');
      }

      const hashedPassword = await hash(password, 14);

      const newUser = await this.userModel.create({
        email,
        password: hashedPassword,
        phone,
        fullname,
      });

      const payload = { sub: newUser._id, email: newUser.email };
      const token = this.jwtService.sign(payload);

      return {
        token,
        user: {
          id: newUser._id,
          email: newUser.email,
          fullname: newUser.fullname,
          phone: newUser.phone,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Registration failed');
    }
  }

  async connectTesla(@Req() req, @Res() res) {
    const userId = req.user.sub;

    const state = crypto.randomUUID();

    // Store state in DB temporarily
    await this.userModel.findByIdAndUpdate(
      userId,
      { teslaState: state },
      { new: true },
    );

    const redirectUrl =
      `https://auth.tesla.com/oauth2/v3/authorize` +
      `?client_id=${process.env.TESLA_CLIENT_ID}` +
      `&redirect_uri=${process.env.TESLA_REDIRECT_URI}` +
      `&response_type=code` +
      `&scope=openid vehicle_device_data` +
      `&state=${state}`;

    return res.redirect(redirectUrl);
  }

  async teslaCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req?: any,
  ) {
    const user = await this.userModel.findOne({ teslaState: state });
    if (!user) {
      throw new UnauthorizedException('Invalid state');
    }

    const tokens = await this.exchangeCodeForToken(code);

    await this.saveTeslaTokens(
      user._id.toString(),
      tokens,
    );

    // Log Tesla connection (async, non-blocking)
    this.auditLogsService.logTeslaConnect(
      user._id.toString(),
      req?.headers?.['x-forwarded-for'] || req?.ip,
      req?.headers?.['user-agent'],
    );

    return { message: 'Tesla account connected.' };
  }

  /**
   * Disconnect Tesla account - call this when user revokes access
   */
  async disconnectTesla(userId: string, reason?: string, req?: any): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      teslaAccessToken: null,
      teslaRefreshToken: null,
      teslaTokenExpiresAt: null,
      teslaState: null,
    });

    // Log disconnection (async, non-blocking)
    this.auditLogsService.logTeslaDisconnect(
      userId,
      reason,
      req?.headers?.['x-forwarded-for'] || req?.ip,
      req?.headers?.['user-agent'],
    );
  }
}
