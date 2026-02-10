// src/api/v1/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/user.module';
import { AuthGuardsModule } from './guards/auth-guards.module';

@Module({
  imports: [
    UsersModule,
    AuthGuardsModule, // Provides JwtAuthGuard and JwtService globally
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
