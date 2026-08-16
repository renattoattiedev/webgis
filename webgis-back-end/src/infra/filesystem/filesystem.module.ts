import { Module } from '@nestjs/common';
import { RasterFilesRepository } from '@/domain/raster-files/application/repositories/raster-files-repository';
import { NfsRasterFilesRepository } from './nfs-raster-files-repository';
import { EnvService } from '@/infra/env/env.service';
import { EnvModule } from '@/infra/env/env.module';

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: RasterFilesRepository,
      useFactory: (env: EnvService) =>
        new NfsRasterFilesRepository(env.get('RASTER_BASE_PATH')),
      inject: [EnvService],
    },
  ],
  exports: [RasterFilesRepository],
})
export class FilesystemModule {}
