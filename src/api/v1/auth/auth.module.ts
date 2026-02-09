// src/api/v1/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/user.module';
@Module({
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
