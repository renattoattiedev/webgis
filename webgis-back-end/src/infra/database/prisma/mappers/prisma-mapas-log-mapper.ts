import { Prisma, MapasLog as PrismaMapasLog } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapasLog } from '@/domain/mapas/enterprise/entities/mapas-log';

export class PrismaMapasLogMapper {
  static toDomain(raw: PrismaMapasLog): MapasLog {
    return MapasLog.create(
      {
        COD_MAPA_ID: raw.COD_MAPA_ID,
      },
      new UniqueEntityID(raw.COD_LOG_ID.toString()),
    );
  }

  static toPrisma(mapaLog: MapasLog): Prisma.MapasLogUncheckedCreateInput {
    return {
      COD_LOG_ID: mapaLog.id.toString(),
      COD_MAPA_ID: mapaLog.codMapa,
    };
  }
}
