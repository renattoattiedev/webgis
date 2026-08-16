import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { FavoritosMapasRepository } from '../repositories/favoritos-mapas-reposistory';
import { FavoritosMapas } from '../../enterprise/entities/favoritos-mapas';

interface RegisteMapaFavoritoUseCaseRequest {
  COD_MAPA_ID: string;
  COD_USER_ID: string;
}
type RegisterMapaFavoritoUseCaseResponse = Either<
  null,
  {
    favorito: FavoritosMapas;
  }
>;
@Injectable()
export class RegisterMapaFavoritoUseCase {
  constructor(private MapaFavoritoRepository: FavoritosMapasRepository) {}
  async execute({
    COD_MAPA_ID,
    COD_USER_ID,
  }: RegisteMapaFavoritoUseCaseRequest): Promise<RegisterMapaFavoritoUseCaseResponse> {
    const MapaFavorito = FavoritosMapas.create({
      COD_MAPA_ID,
      COD_USER_ID,
      DHS_INCLUSAO: new Date(),
    });

    await this.MapaFavoritoRepository.create(MapaFavorito);

    return right({
      favorito: MapaFavorito,
    });
  }
}
