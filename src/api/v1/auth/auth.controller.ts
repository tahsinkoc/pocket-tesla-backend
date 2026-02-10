import { Controller, Post, Body, Get, UseGuards, Req, Res, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('tesla/connect')
  @UseGuards(JwtAuthGuard)
  connectTesla(@Req() req, @Res() res) {
    return this.authService.connectTesla(req, res);
  }

  @Get('tesla/callback')
  // @UseGuards(JwtAuthGuard)
  teslaCallback(@Query('code') code: string,
  @Query('state') state: string, ) {
    return this.authService.teslaCallback(code, state);
  }
}