import {
  Prisma,
  FavoritosCamadasRaster as PismaFavoritosCamadasRaster,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FavoritosCamadasRaster } from '@/domain/camadas-raster/enterprise/entities/favoritos-camadas-raster';

export class PrismaFavoritosCamadasRasterMapper {
  static toDomain(raw: PismaFavoritosCamadasRaster): FavoritosCamadasRaster {
    return FavoritosCamadasRaster.create(
      {
        COD_CAMADA_RASTER_ID: raw.COD_CAMADA_RASTER_ID,
        COD_USER_ID: raw.COD_USER_ID,
      },
      new UniqueEntityID(raw.COD_FAVORITO_ID.toString()),
    );
  }

  static toPrisma(
    favoritos: FavoritosCamadasRaster,
  ): Prisma.FavoritosCamadasRasterUncheckedCreateInput {
    return {
      COD_FAVORITO_ID: favoritos.id.toString(),
      COD_CAMADA_RASTER_ID: favoritos.camada,
      COD_USER_ID: favoritos.user,
    };
  }
}
