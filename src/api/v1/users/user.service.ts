// src/api/v1/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  findById(id: string) {
    return this.userModel.findById(id).exec();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  create(email: string, password: string) {
    return this.userModel.create({ email, password });
  }

  updateTeslaTokens(id: string, tokens: { accessToken: string; refreshToken: string; expiresAt: Date }) {
    return this.userModel.findByIdAndUpdate(id, {
      teslaAccessToken: tokens.accessToken,
      teslaRefreshToken: tokens.refreshToken,
      teslaTokenExpiresAt: tokens.expiresAt,
    }).exec();
  }
}
