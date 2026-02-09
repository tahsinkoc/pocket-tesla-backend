// src/api/v1/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  login(dto: LoginDto) {
    return {
      token: 'jwt-token',
      user: dto.email,
    };
  }

  register(dto:RegisterDto) {

    const { email, password, phone, fullname } = dto;
    
    return {
      token: 'jwt-token',
      user: dto.email,
    };
  }
}
