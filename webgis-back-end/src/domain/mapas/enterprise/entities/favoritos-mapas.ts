import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface FavoritosMapasProps {
  COD_USER_ID: string;
  COD_MAPA_ID: string;
  DHS_INCLUSAO: string;
}

export class FavoritosMapas extends AggregateRoot<FavoritosMapasProps> {
  get user() {
    return this.props.COD_USER_ID;
  }

  get mapa() {
    return this.props.COD_MAPA_ID;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  setUser(userId: string) {
    this.props.COD_USER_ID = userId;
  }

  setMapa(MapaId: string) {
    this.props.COD_MAPA_ID = MapaId;
  }

  static create(props, id?: UniqueEntityID) {
    const favoritos = new FavoritosMapas(
      {
        ...props,
      },
      id,
    );
    return favoritos;
  }
}
