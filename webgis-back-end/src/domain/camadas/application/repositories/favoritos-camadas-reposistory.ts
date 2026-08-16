import { FavoritosCamadas } from '../../enterprise/entities/favoritos-camadas';

export abstract class FavoritosCamadasRepository {
  abstract findFavoritosByUser(
    COD_USER_ID: string,
  ): Promise<FavoritosCamadas[]>;

  abstract checkCamadaFavorita(
    COD_CAMADA_ID: string,
    COD_USER_ID: string,
  ): Promise<FavoritosCamadas | null>;

  abstract create(favoritos: FavoritosCamadas): Promise<void>;

  abstract delete(favoritos: FavoritosCamadas): Promise<void>;
}
