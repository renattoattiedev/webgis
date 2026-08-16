import { FavoritosMapas } from '../../enterprise/entities/favoritos-mapas';

export abstract class FavoritosMapasRepository {
  abstract findFavoritosByUser(COD_USER_ID: string): Promise<FavoritosMapas[]>;

  abstract checkMapaFavorito(
    COD_MAPA_ID: string,
    COD_USER_ID: string,
  ): Promise<FavoritosMapas | null>;

  abstract create(favoritos: FavoritosMapas): Promise<void>;

  abstract delete(favoritos: FavoritosMapas): Promise<void>;
}
