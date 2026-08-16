import {
  Prisma,
  CamadasRasterLog as PrismaCamadasRasterLog,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CamadasRasterLog } from '@/domain/camadas-raster/enterprise/entities/camadas-raster-log';

export class PrismaCamadasRasterLogMapper {
  static toDomain(raw: PrismaCamadasRasterLog): CamadasRasterLog {
    return CamadasRasterLog.create(
      {
        COD_CAMADA_RASTER_ID: raw.COD_CAMADA_RASTER_ID,
      },
      new UniqueEntityID(raw.COD_LOG_ID.toString()),
    );
  }

  static toPrisma(
    camadasRasterLog: CamadasRasterLog,
  ): Prisma.CamadasRasterLogUncheckedCreateInput {
    return {
      COD_LOG_ID: camadasRasterLog.id.toString(),
      COD_CAMADA_RASTER_ID: camadasRasterLog.codCamada,
    };
  }
}
