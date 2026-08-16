import { Module } from '@nestjs/common';
import { EnvModule } from '@/infra/env/env.module';
import { EnvService } from '@/infra/env/env.service';
import { DefaultGdalRunner, GdalCogService } from './gdal-cog.service';

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: GdalCogService,
      useFactory: (env: EnvService) =>
        new GdalCogService(new DefaultGdalRunner(), {
          // Use the same NFS-backed raster repository where uploads land.
          // GEOSERVER_RASTER_PATH is the *container-internal* path GeoServer
          // sees, which differs from where the api writes uploads.
          basePath: env.get('RASTER_BASE_PATH'),
          timeoutMs: env.get('GDAL_COG_TIMEOUT_MS'),
          numThreads: env.get('GDAL_COG_NUM_THREADS'),
        }),
      inject: [EnvService],
    },
  ],
  exports: [GdalCogService],
})
export class GdalModule {}
