import { Module } from '@nestjs/common';
import { DwDatabaseService } from './dw-database.service';
import { EnvModule } from '@/infra/env/env.module';

@Module({
  imports: [EnvModule],
  providers: [DwDatabaseService],
  exports: [DwDatabaseService],
})
export class DwDatabaseModule {}
