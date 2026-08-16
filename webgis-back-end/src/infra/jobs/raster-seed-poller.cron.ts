import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { GwcSeedService } from '@/infra/modulos_ext/geoserver/gwc-seed.service';

@Injectable()
export class RasterSeedPollerCron {
  private readonly logger = new Logger(RasterSeedPollerCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gwc: GwcSeedService,
  ) {}

  @Cron('*/15 * * * * *') // every 15 seconds
  async poll(): Promise<void> {
    const rows = await this.prisma.camadasRaster.findMany({
      where: { DSC_SEED_STATUS: 'seeding' },
      select: { COD_CAMADA_RASTER_ID: true, NOM_NOME: true },
    });

    for (const row of rows) {
      try {
        const { percent, status } = await this.gwc.getSeedProgress(
          row.NOM_NOME,
        );
        await this.prisma.camadasRaster.update({
          where: { COD_CAMADA_RASTER_ID: row.COD_CAMADA_RASTER_ID },
          data: { NUM_SEED_PROGRESS: percent, DSC_SEED_STATUS: status },
        });
      } catch (err: any) {
        this.logger.error(
          `Falha ao consultar progresso do seed para ${row.NOM_NOME}: ${err?.message}`,
        );
      }
    }
  }
}
