import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FavoritosMapasRepository } from '../repositories/favoritos-mapas-reposistory';

interface CheckMapaFavoritoUseCaseRequest {
  COD_MAPA_ID: string;
  COD_USER_ID: string;
}

type CheckMapaFavoritoUseCaseResponse = Either<
  null,
  {
    favorito: boolean;
  }
>;

@Injectable()
export class CheckMapaFavoritoUseCase {
  constructor(private favoritosRepository: FavoritosMapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_USER_ID,
  }: CheckMapaFavoritoUseCaseRequest): Promise<CheckMapaFavoritoUseCaseResponse> {
    const favorito = await this.favoritosRepository.checkMapaFavorito(
      COD_MAPA_ID,
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
