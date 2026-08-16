import {
  Prisma,
  MapasCamadasFiltros as PrismaMapasCamadasFiltros,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapasCamadasFiltros } from '@/domain/mapas/enterprise/entities/mapas-camadas-filtro';

export class PrismaMapasCamadasFiltrosMapper {
  static toDomain(raw: PrismaMapasCamadasFiltros): MapasCamadasFiltros {
    return MapasCamadasFiltros.create(
      {
        COD_MAPA_CAMADA_ID: raw.COD_MAPA_CAMADA_ID,
        DSC_FILTRO: raw.DSC_FILTRO,
      },
      new UniqueEntityID(raw.COD_FILTRO_ID.toString()),
    );
  }

  static toPrisma(
    mapasCamadasFiltros: MapasCamadasFiltros,
  ): Prisma.MapasCamadasFiltrosUncheckedCreateInput {
    return {
      COD_MAPA_CAMADA_ID: mapasCamadasFiltros.id.toString(),
      DSC_FILTRO: mapasCamadasFiltros.filtroCamadaMapa,
    };
  }
}
