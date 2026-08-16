import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FavoritosMapasRepository } from '@/domain/mapas/application/repositories/favoritos-mapas-reposistory';
import { PrismaFavoritosMapasMapper } from '../mappers/prisma-favoritos-mapas-mapper';
import { FavoritosMapas } from '@/domain/mapas/enterprise/entities/favoritos-mapas';

@Injectable()
export class PrismaFavoritosMapasRepository
  implements FavoritosMapasRepository
{
  constructor(private prisma: PrismaService) {}
  async findFavoritosByUser(COD_USER_ID: string): Promise<FavoritosMapas[]> {
    const favoritos = await this.prisma.favoritosMapas.findMany({
      where: {
        COD_USER_ID,
      },
    });
    return favoritos.map(PrismaFavoritosMapasMapper.toDomain);
  }

  async checkMapaFavorito(
    COD_MAPA_ID: string,
    COD_USER_ID: string,
  ): Promise<FavoritosMapas | null> {
    const favoritos = await this.prisma.favoritosMapas.findFirst({
      where: {
        COD_USER_ID,
        COD_MAPA_ID,
      },
    });
    if (!favoritos) {
      return null;
    }
    return PrismaFavoritosMapasMapper.toDomain(favoritos);
  }

  async create(favoritos: FavoritosMapas): Promise<void> {
    const data = PrismaFavoritosMapasMapper.toPrisma(favoritos);
    await this.prisma.favoritosMapas.create({
      data,
    });
  }

  async delete(favoritos: FavoritosMapas): Promise<void> {
    await this.prisma.favoritosMapas.delete({
      where: {
        COD_FAVORITO_ID: favoritos.id.toString(),
      },
    });
  }
}
