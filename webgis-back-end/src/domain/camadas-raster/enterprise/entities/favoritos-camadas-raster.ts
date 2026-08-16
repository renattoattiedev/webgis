import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface FavoritosCamadasRasterProps {
  COD_USER_ID: string;
  COD_CAMADA_RASTER_ID: string;
  DHS_INCLUSAO: string;
}

export class FavoritosCamadasRaster extends AggregateRoot<FavoritosCamadasRasterProps> {
  get user() {
    return this.props.COD_USER_ID;
  }

  get camada() {
    return this.props.COD_CAMADA_RASTER_ID;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  setUser(userId: string) {
    this.props.COD_USER_ID = userId;
  }

  setCamada(camadaId: string) {
    this.props.COD_CAMADA_RASTER_ID = camadaId;
  }

  static create(props, id?: UniqueEntityID) {
    const favoritos = new FavoritosCamadasRaster(
      {
        ...props,
      },
      id,
    );
    return favoritos;
  }
}
