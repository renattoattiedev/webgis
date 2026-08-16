import { Prisma, MapasCamadas as PrismaMapasCamadas } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapasCamadas } from '@/domain/mapas/enterprise/entities/mapas-camadas';

export class PrismaMapasCamadasMapper {
  static toDomain(raw: PrismaMapasCamadas): MapasCamadas {
    return MapasCamadas.create(
      {
        COD_CAMADA_ID: raw.COD_CAMADA_ID,
        COD_MAPA_ID: raw.COD_MAPA_ID,
        NUM_ORDEM_RENDERIZACAO: raw.NUM_ORDEM_RENDERIZACAO,
      },
      new UniqueEntityID(raw.COD_MAPA_CAMADA_ID.toString()),
    );
  }

  static toPrisma(
    mapasCamadas: MapasCamadas,
  ): Prisma.MapasCamadasUncheckedCreateInput {
    return {
      COD_MAPA_CAMADA_ID: mapasCamadas.id.toString(),
      COD_CAMADA_ID: mapasCamadas.codCamadaId,
      COD_MAPA_ID: mapasCamadas.codMapaId,
      NUM_ORDEM_RENDERIZACAO: mapasCamadas.numOrdemRenderizacao,
    };
  }
}
