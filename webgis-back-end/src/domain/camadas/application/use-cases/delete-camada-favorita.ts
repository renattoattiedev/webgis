import { left } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { FavoritosCamadasRepository } from '../repositories/favoritos-camadas-reposistory';

interface DeleteFavoritosUseCaseRequest {
  COD_CAMADA_ID: string;
  COD_USER_ID: string;
}

@Injectable()
export class DeleteCamadaFavoritaUseCase {
  constructor(private favoritosRepository: FavoritosCamadasRepository) {}

  async execute({ COD_CAMADA_ID, COD_USER_ID }: DeleteFavoritosUseCaseRequest) {
    const existingFavorito = await this.favoritosRepository.checkCamadaFavorita(
      COD_CAMADA_ID,
      COD_USER_ID,
    );

    if (!existingFavorito) {
      return left(new Error('Camada Favorita não encontrada'));
    }

    await this.favoritosRepository.delete(existingFavorito);
  }
}
