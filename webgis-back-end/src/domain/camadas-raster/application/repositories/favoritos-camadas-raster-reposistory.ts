import { FavoritosCamadasRaster } from '../../enterprise/entities/favoritos-camadas-raster';

export abstract class FavoritosCamadasRasterRepository {
  abstract findFavoritosByUser(
    COD_USER_ID: string,
  ): Promise<FavoritosCamadasRaster[]>;

  abstract checkCamadaFavorita(
    COD_CAMADA_RASTER_ID: string,
    COD_USER_ID: string,
  ): Promise<FavoritosCamadasRaster | null>;

  abstract create(favoritos: FavoritosCamadasRaster): Promise<void>;

  abstract delete(favoritos: FavoritosCamadasRaster): Promise<void>;
}
