import { Controller, Post, Body, Get, UseGuards, Req, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Login with email and password
   * Returns JWT token on successful authentication
   */
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticates user with email and password, returns JWT token',
  })
  @ApiResponse({ status: 200, description: 'Login successful, JWT token returned' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Register a new user
   * Creates new account and returns JWT token
   */
  @Post('register')
  @ApiOperation({
    summary: 'User registration',
    description: 'Creates new user account with email, password, phone, and fullname',
  })
  @ApiResponse({ status: 201, description: 'Registration successful, JWT token returned' })
  @ApiResponse({ status: 401, description: 'User already exists or invalid data' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Initiate Tesla account connection
   * Redirects user to Tesla OAuth login page
   */
  @Get('tesla/connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Connect Tesla account',
    description: 'Initiates OAuth flow to connect user\'s Tesla account',
  })
  @ApiResponse({ status: 302, description: 'Redirects to Tesla OAuth' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  connectTesla(@Req() req, @Res() res) {
    return this.authService.connectTesla(req, res);
  }

  /**
   * Tesla OAuth callback
   * Handles return from Tesla OAuth, saves tokens
   */
  @Get('tesla/callback')
  @ApiOperation({
    summary: 'Tesla OAuth callback',
    description: 'Handles OAuth callback from Tesla and saves access tokens',
  })
  @ApiQuery({ name: 'code', description: 'OAuth authorization code' })
  @ApiQuery({ name: 'state', description: 'OAuth state parameter' })
  @ApiResponse({ status: 200, description: 'Tesla account connected successfully' })
  @ApiResponse({ status: 401, description: 'Invalid state or authorization failed' })
  teslaCallback(
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return this.authService.teslaCallback(code, state);
  }
}
