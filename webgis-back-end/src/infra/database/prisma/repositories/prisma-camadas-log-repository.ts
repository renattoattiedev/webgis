import { CamadasLogRepository } from '@/domain/camadas/application/repositories/camadas-logs-repository';
import { CamadasLog } from '@/domain/camadas/enterprise/entities/camadas-log';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaCamadasLogMapper } from '../mappers/prisma-camadas-log-mapper';

@Injectable()
export class PrismaCamadasLogRepository implements CamadasLogRepository {
  constructor(private prisma: PrismaService) {}

  async findByAcesso(DHS_ACESSO: Date): Promise<CamadasLog | null> {
    const camadaLog = await this.prisma.camadasLog.findFirst({
      where: {
        DHS_ACESSO,
      },
    });
    if (!camadaLog) {
      return null;
    }
    return PrismaCamadasLogMapper.toDomain(camadaLog);
  }

  async findManyByAcesso(
    DHS_ACESSO_INICIO: Date,
    DHS_ACESSO_FIM: Date,
  ): Promise<CamadasLog[]> {
    const camadaLog = await this.prisma.camadasLog.findMany({
      where: {
        DHS_ACESSO: {
          gte: DHS_ACESSO_INICIO,
          lte: DHS_ACESSO_FIM,
        },
      },
    });

    return camadaLog.map(PrismaCamadasLogMapper.toDomain);
  }

  async findMany(): Promise<CamadasLog[]> {
    const camadaLog = await this.prisma.camadasLog.findMany();
    return camadaLog.map(PrismaCamadasLogMapper.toDomain);
  }

  async findById(COD_CAMADA_ID: string): Promise<CamadasLog | null> {
    const camadaLog = await this.prisma.camadasLog.findFirst({
      where: {
        COD_CAMADA_ID,
      },
    });
    if (!camadaLog) {
      return null;
    }
    return PrismaCamadasLogMapper.toDomain(camadaLog);
  }

  async getAcessosByCamadasId(COD_CAMADA_ID: string): Promise<number> {
    if (!COD_CAMADA_ID) {
      return 0;
    }

    const result = await this.prisma.camadasLog.aggregate({
      _count: {
        COD_CAMADA_ID: true,
      },
      where: {
        COD_CAMADA_ID,
      },
    });
    return result._count.COD_CAMADA_ID;
  }

  async create(camadaLog: CamadasLog): Promise<void> {
    const data = PrismaCamadasLogMapper.toPrisma(camadaLog);

    await this.prisma.camadasLog.create({
      data,
    });
  }
}
