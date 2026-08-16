import { Module } from '@nestjs/common';
import { MetadadosPostgis } from './metadados-postgis';
import { EnvModule } from '@/infra/env/env.module';
import { HttpModule } from '@nestjs/axios';
@Module({
  imports: [EnvModule, HttpModule],
  providers: [MetadadosPostgis],
  exports: [MetadadosPostgis],
})
export class MetadadosPostgisModule {}
