import {
  Prisma,
  FavoritosCamadas as PismaFavoritosCamadas,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FavoritosCamadas } from '@/domain/camadas/enterprise/entities/favoritos-camadas';

export class PrismaFavoritosCamadasMapper {
  static toDomain(raw: PismaFavoritosCamadas): FavoritosCamadas {
    return FavoritosCamadas.create(
      {
        COD_CAMADA_ID: raw.COD_CAMADA_ID,
        COD_USER_ID: raw.COD_USER_ID,
      },
      new UniqueEntityID(raw.COD_FAVORITO_ID.toString()),
    );
  }

  static toPrisma(
    favoritos: FavoritosCamadas,
  ): Prisma.FavoritosCamadasUncheckedCreateInput {
    return {
      COD_FAVORITO_ID: favoritos.id.toString(),
      COD_CAMADA_ID: favoritos.camada,
      COD_USER_ID: favoritos.user,
    };
  }
}
