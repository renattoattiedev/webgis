import { Module } from '@nestjs/common';
import axios from 'axios';
import { GeoserverAPI } from './geoserver-api';
import { ConfigModule } from '@/config/config.module';
import { HttpModule } from '@nestjs/axios';
import { GeoserverOGC } from './geoserver-ogc';
import { MinioModule } from '../minio/minio.module';
import { MinioAPI } from '../minio/minio-api';
import { ConfigService } from '@/config/config.service';
import { RasterPublicacaoService } from './raster-publicacao.service';
import { EnvService } from '@/infra/env/env.service';
import { EnvModule } from '@/infra/env/env.module';
import { GwcSeedService, GwcHttpClient } from './gwc-seed.service';
import { RasterRepublicacaoRunner } from './raster-republicacao.runner';
import { GdalModule } from '../gdal/gdal.module';
import { DatabaseModule } from '@/infra/database/database.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MinioModule,
    EnvModule,
    GdalModule,
    DatabaseModule,
  ],
  providers: [
    GeoserverAPI,
    GeoserverOGC,
    ConfigService,
    MinioAPI,
    {
      provide: RasterPublicacaoService,
      useFactory: (geo: GeoserverAPI, env: EnvService) => {
        const svc = new RasterPublicacaoService(geo);
        svc.setGeoserverRasterPath(env.get('GEOSERVER_RASTER_PATH'));
        return svc;
      },
      inject: [GeoserverAPI, EnvService],
    },
    {
      provide: GwcSeedService,
      useFactory: async (env: EnvService, config: ConfigService) => {
        const baseUrl = (await config.getConfig('GEOSERVER_URL')) ?? '';
        const username = (await config.getConfig('GEOSERVER_USER')) ?? '';
        const password = (await config.getConfig('GEOSERVER_PASSWORD')) ?? '';
        const http: GwcHttpClient = {
          post: (url, body, auth) =>
            axios.post(url, body, {
              headers: { 'Content-Type': 'application/json' },
              auth,
            }),
          get: (url, auth) =>
            axios.get(url, { headers: { Accept: 'application/json' }, auth }),
        };
        return new GwcSeedService(http, {
          baseUrl,
          threadCount: env.get('GWC_SEED_THREAD_COUNT'),
          maxZoom: env.get('GWC_SEED_MAX_ZOOM'),
          auth: { username, password },
        });
      },
      inject: [EnvService, ConfigService],
    },
    RasterRepublicacaoRunner,
  ],
  exports: [
    GeoserverAPI,
    GeoserverOGC,
    RasterPublicacaoService,
    GwcSeedService,
    RasterRepublicacaoRunner,
  ],
})
export class GeoserverModule {}
