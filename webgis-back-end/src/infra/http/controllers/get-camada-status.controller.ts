import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

@Controller('/camadas')
export class GetCamadaStatusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('/:id/status')
  async handle(@Param('id') id: string) {
    const row = await this.prisma.camadas.findUnique({
      where: { COD_CAMADA_ID: id },
      select: {
        DSC_STATUS: true,
        DSC_BOUNDING_BOX: true,
        DSC_ERROR_MSG: true,
      },
    });
    if (!row) throw new NotFoundException('Camada não encontrada');
    return {
      status: row.DSC_STATUS ?? 'published',
      boundingBox: row.DSC_BOUNDING_BOX
        ? JSON.parse(row.DSC_BOUNDING_BOX)
        : null,
      error: row.DSC_ERROR_MSG ?? null,
    };
  }
}
