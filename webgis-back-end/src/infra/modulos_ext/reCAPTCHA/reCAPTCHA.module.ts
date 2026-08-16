import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReCAPTCHAAPI } from './reCAPTCHA-api';
import { ConfigModule } from '@/config/config.module';
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [ReCAPTCHAAPI],
  exports: [ReCAPTCHAAPI],
})
export class ReCAPTCHAModule {}
