import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { envSchema } from './env/env';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from './http/http.module';
import { EnvModule } from './env/env.module';
import { DatabaseModule } from './database/database.module';
import { GeoserverModule } from './modulos_ext/geoserver/geoserver.module';
import { RasterSeedPollerCron } from '@/infra/jobs/raster-seed-poller.cron';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
    HttpModule,
    EnvModule,
    DatabaseModule,
    GeoserverModule,
  ],
  providers: [RasterSeedPollerCron],
})
export class AppModule {}
