import { Prisma, CamadasLog as PrismaCamadasLog } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CamadasLog } from '@/domain/camadas/enterprise/entities/camadas-log';

export class PrismaCamadasLogMapper {
  static toDomain(raw: PrismaCamadasLog): CamadasLog {
    return CamadasLog.create(
      {
        COD_CAMADA_ID: raw.COD_CAMADA_ID,
      },
      new UniqueEntityID(raw.COD_LOG_ID.toString()),
    );
  }

  static toPrisma(
    camadaLog: CamadasLog,
  ): Prisma.CamadasLogUncheckedCreateInput {
    return {
      COD_LOG_ID: camadaLog.id.toString(),
      COD_CAMADA_ID: camadaLog.codCamada,
    };
  }
}
