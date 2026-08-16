import { Prisma, FavoritosMapas as PismaFavoritosMapas } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FavoritosMapas } from '@/domain/mapas/enterprise/entities/favoritos-mapas';

export class PrismaFavoritosMapasMapper {
  static toDomain(raw: PismaFavoritosMapas): FavoritosMapas {
    return FavoritosMapas.create(
      {
        COD_MAPA_ID: raw.COD_MAPA_ID,
        COD_USER_ID: raw.COD_USER_ID,
      },
      new UniqueEntityID(raw.COD_FAVORITO_ID.toString()),
    );
  }

  static toPrisma(
    favoritos: FavoritosMapas,
  ): Prisma.FavoritosMapasUncheckedCreateInput {
    return {
      COD_FAVORITO_ID: favoritos.id.toString(),
      COD_MAPA_ID: favoritos.mapa,
      COD_USER_ID: favoritos.user,
    };
  }
}
