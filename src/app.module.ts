import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { V1Module } from './api/v1/v1.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    V1Module,
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
// src/app.module.ts

