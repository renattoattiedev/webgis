import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FavoritosCamadasRepository } from '../repositories/favoritos-camadas-reposistory';

interface CheckCamadaFavoritaUseCaseRequest {
  COD_CAMADA_ID: string;
  COD_USER_ID: string;
}

type CheckCamadaFavoritaUseCaseResponse = Either<
  null,
  {
    favorito: boolean;
  }
>;

@Injectable()
export class CheckCamadaFavoritaUseCase {
  constructor(private favoritosRepository: FavoritosCamadasRepository) {}

  async execute({
    COD_CAMADA_ID,
    COD_USER_ID,
  }: CheckCamadaFavoritaUseCaseRequest): Promise<CheckCamadaFavoritaUseCaseResponse> {
    const favorito = await this.favoritosRepository.checkCamadaFavorita(
      COD_CAMADA_ID,
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
