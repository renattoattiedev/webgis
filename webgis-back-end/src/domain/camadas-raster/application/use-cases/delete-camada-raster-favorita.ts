import { left } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FavoritosCamadasRasterRepository } from '../repositories/favoritos-camadas-raster-reposistory';

interface DeleteFavoritosUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
  COD_USER_ID: string;
}

@Injectable()
export class DeleteCamadaRasterFavoritaUseCase {
  constructor(
    private favoritosCamadasRasterRepository: FavoritosCamadasRasterRepository,
  ) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    COD_USER_ID,
  }: DeleteFavoritosUseCaseRequest) {
    const existingFavorito =
      await this.favoritosCamadasRasterRepository.checkCamadaFavorita(
        COD_CAMADA_RASTER_ID,
        COD_USER_ID,
      );

    if (!existingFavorito) {
      return left(new Error('Camada Raster Favorita não encontrada'));
    }

    await this.favoritosCamadasRasterRepository.delete(existingFavorito);
  }
}
