import { left } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FavoritosMapasRepository } from '../repositories/favoritos-mapas-reposistory';

interface DeleteFavoritosUseCaseRequest {
  COD_MAPA_ID: string;
  COD_USER_ID: string;
}

@Injectable()
export class DeleteMapaFavoritoUseCase {
  constructor(private favoritosRepository: FavoritosMapasRepository) {}

  async execute({ COD_MAPA_ID, COD_USER_ID }: DeleteFavoritosUseCaseRequest) {
    const existingFavorito = await this.favoritosRepository.checkMapaFavorito(
      COD_MAPA_ID,
      COD_USER_ID,
    );

    if (!existingFavorito) {
      return left(new Error('Mapa Favorito não encontrada'));
    }

    await this.favoritosRepository.delete(existingFavorito);
  }
}
