import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FavoritosCamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/favoritos-camadas-raster-reposistory';
import { PrismaFavoritosCamadasRasterMapper } from '../mappers/prisma-favoritos-camadas-raster-mapper';
import { FavoritosCamadasRaster } from '@/domain/camadas-raster/enterprise/entities/favoritos-camadas-raster';

@Injectable()
export class PrismaFavoritosCamadasRasterRepository
  implements FavoritosCamadasRasterRepository
{
  constructor(private prisma: PrismaService) {}
  async findFavoritosByUser(
    COD_USER_ID: string,
  ): Promise<FavoritosCamadasRaster[]> {
    const favoritos = await this.prisma.favoritosCamadasRaster.findMany({
      where: {
        COD_USER_ID,
      },
    });
    return favoritos.map(PrismaFavoritosCamadasRasterMapper.toDomain);
  }

  async checkCamadaFavorita(
    COD_CAMADA_RASTER_ID: string,
    COD_USER_ID: string,
  ): Promise<FavoritosCamadasRaster | null> {
    const favoritos = await this.prisma.favoritosCamadasRaster.findFirst({
      where: {
        COD_USER_ID,
        COD_CAMADA_RASTER_ID,
      },
    });
    if (!favoritos) {
      return null;
    }
    return PrismaFavoritosCamadasRasterMapper.toDomain(favoritos);
  }

  async create(favoritos: FavoritosCamadasRaster): Promise<void> {
    const data = PrismaFavoritosCamadasRasterMapper.toPrisma(favoritos);
    await this.prisma.favoritosCamadasRaster.create({
      data,
    });
  }

  async delete(favoritos: FavoritosCamadasRaster): Promise<void> {
    await this.prisma.favoritosCamadasRaster.delete({
      where: {
        COD_FAVORITO_ID: favoritos.id.toString(),
      },
    });
  }
}
