import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

@Controller('/camadas-raster')
export class GetCamadaRasterStatusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/:id/status')
  async handle(@Param('id') id: string) {
    const row = await this.prisma.camadasRaster.findUnique({
      where: { COD_CAMADA_RASTER_ID: id },
      select: {
        DSC_STATUS: true,
        DSC_BOUNDING_BOX: true,
        DSC_ERROR_MSG: true,
        NUM_UPLOAD_PROGRESS: true,
        DSC_SEED_STATUS: true,
        NUM_SEED_PROGRESS: true,
      },
    });
    if (!row) throw new NotFoundException('Camada não encontrada');
    return {
      status: row.DSC_STATUS ?? 'unknown',
      progress: row.NUM_UPLOAD_PROGRESS ?? 0,
      boundingBox: row.DSC_BOUNDING_BOX
        ? JSON.parse(row.DSC_BOUNDING_BOX)
        : null,
      error: row.DSC_ERROR_MSG ?? null,
      seedStatus: row.DSC_SEED_STATUS ?? 'idle',
      seedProgress: row.NUM_SEED_PROGRESS ?? 0,
    };
  }
}
