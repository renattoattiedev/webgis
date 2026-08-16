import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FavoritosCamadasRasterRepository } from '../repositories/favoritos-camadas-raster-reposistory';

interface CheckCamadaRasterFavoritaUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
  COD_USER_ID: string;
}

type CheckCamadaRasterFavoritaUseCaseResponse = Either<
  null,
  {
    favorito: boolean;
  }
>;

@Injectable()
export class CheckCamadaRasterFavoritaUseCase {
  constructor(
    private favoritosCamadasRasterRepository: FavoritosCamadasRasterRepository,
  ) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    COD_USER_ID,
  }: CheckCamadaRasterFavoritaUseCaseRequest): Promise<CheckCamadaRasterFavoritaUseCaseResponse> {
    const favorito =
      await this.favoritosCamadasRasterRepository.checkCamadaFavorita(
        COD_CAMADA_RASTER_ID,
        COD_USER_ID,
      );

    if (!favorito) {
      return right({
        favorito: false,
      });
    }

    return right({
      favorito: true,
    });
  }
}
