import { MapasLogRepository } from '@/domain/mapas/application/repositories/mapas-logs-repository';
import { MapasLog } from '@/domain/mapas/enterprise/entities/mapas-log';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaMapasLogMapper } from '../mappers/prisma-mapas-log-mapper';

@Injectable()
export class PrismaMapasLogRepository implements MapasLogRepository {
  constructor(private prisma: PrismaService) {}

  async findByAcesso(DHS_ACESSO: Date): Promise<MapasLog | null> {
    const MapaLog = await this.prisma.mapasLog.findFirst({
      where: {
        DHS_ACESSO,
      },
    });
    if (!MapaLog) {
      return null;
    }
    return PrismaMapasLogMapper.toDomain(MapaLog);
  }

  async findManyByAcesso(
    DHS_ACESSO_INICIO: Date,
    DHS_ACESSO_FIM: Date,
  ): Promise<MapasLog[]> {
    const MapaLog = await this.prisma.mapasLog.findMany({
      where: {
        DHS_ACESSO: {
          gte: DHS_ACESSO_INICIO,
          lte: DHS_ACESSO_FIM,
        },
      },
    });

    return MapaLog.map(PrismaMapasLogMapper.toDomain);
  }

  async findMany(): Promise<MapasLog[]> {
    const MapaLog = await this.prisma.mapasLog.findMany();
    return MapaLog.map(PrismaMapasLogMapper.toDomain);
  }

  async findById(COD_MAPA_ID: string): Promise<MapasLog | null> {
    const MapaLog = await this.prisma.mapasLog.findFirst({
      where: {
        COD_MAPA_ID,
      },
    });
    if (!MapaLog) {
      return null;
    }
    return PrismaMapasLogMapper.toDomain(MapaLog);
  }

  async getAcessosByMapasId(COD_MAPA_ID: string): Promise<number> {
    if (!COD_MAPA_ID) {
      return 0;
    }

    const result = await this.prisma.mapasLog.aggregate({
      _count: {
        COD_MAPA_ID: true,
      },
      where: {
        COD_MAPA_ID,
      },
    });
    return result._count.COD_MAPA_ID;
  }

  async create(MapaLog: MapasLog): Promise<void> {
    const data = PrismaMapasLogMapper.toPrisma(MapaLog);

    await this.prisma.mapasLog.create({
      data,
    });
  }
}
