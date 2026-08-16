import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { FavoritosCamadasRasterRepository } from '../repositories/favoritos-camadas-raster-reposistory';
import { FavoritosCamadasRaster } from '../../enterprise/entities/favoritos-camadas-raster';

interface RegisteCamadaRasterFavoritaUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
  COD_USER_ID: string;
}
type RegisterCamadaRasterFavoritaUseCaseResponse = Either<
  null,
  {
    favorito: FavoritosCamadasRaster;
  }
>;
@Injectable()
export class RegisterCamadaRasterFavoritaUseCase {
  constructor(
    private favoritosCamadasRasterRepository: FavoritosCamadasRasterRepository,
  ) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    COD_USER_ID,
  }: RegisteCamadaRasterFavoritaUseCaseRequest): Promise<RegisterCamadaRasterFavoritaUseCaseResponse> {
    const favorito = FavoritosCamadasRaster.create({
      COD_CAMADA_RASTER_ID,
      COD_USER_ID,
      DHS_INCLUSAO: new Date(),
    });

    await this.favoritosCamadasRasterRepository.create(favorito);

    return right({
      favorito,
    });
  }
}
