import {
  Prisma,
  MapasCamadasRaster as PrismaMapasCamadasRaster,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapasCamadasRaster } from '@/domain/mapas/enterprise/entities/mapas-camadas-raster';

export class PrismaMapasCamadasRasterMapper {
  static toDomain(raw: PrismaMapasCamadasRaster): MapasCamadasRaster {
    return MapasCamadasRaster.create(
      {
        COD_CAMADA_RASTER_ID: raw.COD_CAMADA_RASTER_ID,
        COD_MAPA_ID: raw.COD_MAPA_ID,
        NUM_ORDEM_RENDERIZACAO: raw.NUM_ORDEM_RENDERIZACAO,
      },
      new UniqueEntityID(raw.COD_MAPA_CAMADA_RASTER_ID.toString()),
    );
  }

  static toPrisma(
    mapasCamadasRaster: MapasCamadasRaster,
  ): Prisma.MapasCamadasRasterUncheckedCreateInput {
    return {
      COD_MAPA_CAMADA_RASTER_ID: mapasCamadasRaster.id.toString(),
      COD_CAMADA_RASTER_ID: mapasCamadasRaster.codCamadaId,
      COD_MAPA_ID: mapasCamadasRaster.codMapaId,
      NUM_ORDEM_RENDERIZACAO: mapasCamadasRaster.numOrdemRenderizacao,
    };
  }
}
