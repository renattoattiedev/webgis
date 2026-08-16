import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FavoritosCamadasRepository } from '@/domain/camadas/application/repositories/favoritos-camadas-reposistory';
import { PrismaFavoritosCamadasMapper } from '../mappers/prisma-favoritos-camadas-mapper';
import { FavoritosCamadas } from '@/domain/camadas/enterprise/entities/favoritos-camadas';

@Injectable()
export class PrismaFavoritosCamadasRepository
  implements FavoritosCamadasRepository
{
  constructor(private prisma: PrismaService) {}
  async findFavoritosByUser(COD_USER_ID: string): Promise<FavoritosCamadas[]> {
    const favoritos = await this.prisma.favoritosCamadas.findMany({
      where: {
        COD_USER_ID,
      },
    });
    return favoritos.map(PrismaFavoritosCamadasMapper.toDomain);
  }

  async checkCamadaFavorita(
    COD_CAMADA_ID: string,
    COD_USER_ID: string,
  ): Promise<FavoritosCamadas | null> {
    const favoritos = await this.prisma.favoritosCamadas.findFirst({
      where: {
        COD_USER_ID,
        COD_CAMADA_ID,
      },
    });
    if (!favoritos) {
      return null;
    }
    return PrismaFavoritosCamadasMapper.toDomain(favoritos);
  }

  async create(favoritos: FavoritosCamadas): Promise<void> {
    const data = PrismaFavoritosCamadasMapper.toPrisma(favoritos);
    await this.prisma.favoritosCamadas.create({
      data,
    });
  }

  async delete(favoritos: FavoritosCamadas): Promise<void> {
    await this.prisma.favoritosCamadas.delete({
      where: {
        COD_FAVORITO_ID: favoritos.id.toString(),
      },
    });
  }
}
