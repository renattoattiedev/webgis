import { CamadasRasterLogRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-logs-repository';
import { CamadasRasterLog } from '@/domain/camadas-raster/enterprise/entities/camadas-raster-log';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaCamadasRasterLogMapper } from '../mappers/prisma-camadas-raster-log-mapper';

@Injectable()
export class PrismaCamadasRasterLogRepository
  implements CamadasRasterLogRepository
{
  constructor(private prisma: PrismaService) {}

  async findByAcesso(DHS_ACESSO: Date): Promise<CamadasRasterLog | null> {
    const camadaLog = await this.prisma.camadasRasterLog.findFirst({
      where: {
        DHS_ACESSO,
      },
    });
    if (!camadaLog) {
      return null;
    }
    return PrismaCamadasRasterLogMapper.toDomain(camadaLog);
  }

  async findManyByAcesso(
    DHS_ACESSO_INICIO: Date,
    DHS_ACESSO_FIM: Date,
  ): Promise<CamadasRasterLog[]> {
    const camadaLog = await this.prisma.camadasRasterLog.findMany({
      where: {
        DHS_ACESSO: {
          gte: DHS_ACESSO_INICIO,
          lte: DHS_ACESSO_FIM,
        },
      },
    });

    return camadaLog.map(PrismaCamadasRasterLogMapper.toDomain);
  }

  async findMany(): Promise<CamadasRasterLog[]> {
    const camadaLog = await this.prisma.camadasRasterLog.findMany();
    return camadaLog.map(PrismaCamadasRasterLogMapper.toDomain);
  }

  async findById(
    COD_CAMADA_RASTER_ID: string,
  ): Promise<CamadasRasterLog | null> {
    const camadaLog = await this.prisma.camadasRasterLog.findFirst({
      where: {
        COD_CAMADA_RASTER_ID,
      },
    });
    if (!camadaLog) {
      return null;
    }
    return PrismaCamadasRasterLogMapper.toDomain(camadaLog);
  }

  async getAcessosByCamadasId(COD_CAMADA_RASTER_ID: string): Promise<number> {
    if (!COD_CAMADA_RASTER_ID) {
      return 0;
    }

    const result = await this.prisma.camadasRasterLog.aggregate({
      _count: {
        COD_CAMADA_RASTER_ID: true,
      },
      where: {
        COD_CAMADA_RASTER_ID,
      },
    });
    return result._count.COD_CAMADA_RASTER_ID;
  }

  async create(camadaLog: CamadasRasterLog): Promise<void> {
    const data = PrismaCamadasRasterLogMapper.toPrisma(camadaLog);

    await this.prisma.camadasRasterLog.create({
      data,
    });
  }
}
