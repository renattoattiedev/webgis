import { Module } from '@nestjs/common';
import { MinioAPI } from './minio-api';
import { ConfigModule } from '@/config/config.module';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [ConfigModule, HttpModule],
  providers: [MinioAPI],
  exports: [MinioAPI],
})
export class MinioModule {}
