import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { PrismaClient } from '@prisma/client';

@Module({
  providers: [ConfigService, PrismaClient],
  exports: [ConfigService],
})
export class ConfigModule {}
