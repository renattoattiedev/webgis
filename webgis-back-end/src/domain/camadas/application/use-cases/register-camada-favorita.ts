import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { FavoritosCamadasRepository } from '../repositories/favoritos-camadas-reposistory';
import { FavoritosCamadas } from '../../enterprise/entities/favoritos-camadas';

interface RegisteCamadaFavoritaUseCaseRequest {
  COD_CAMADA_ID: string;
  COD_USER_ID: string;
}
type RegisterCamadaFavoritaUseCaseResponse = Either<
  null,
  {
    favorito: FavoritosCamadas;
  }
>;
@Injectable()
export class RegisterCamadaFavoritaUseCase {
  constructor(private camadaFavoritaRepository: FavoritosCamadasRepository) {}
  async execute({
    COD_CAMADA_ID,
    COD_USER_ID,
  }: RegisteCamadaFavoritaUseCaseRequest): Promise<RegisterCamadaFavoritaUseCaseResponse> {
    const camadaFavorita = FavoritosCamadas.create({
      COD_CAMADA_ID,
      COD_USER_ID,
      DHS_INCLUSAO: new Date(),
    });

    await this.camadaFavoritaRepository.create(camadaFavorita);

    return right({
      favorito: camadaFavorita,
    });
  }
}
