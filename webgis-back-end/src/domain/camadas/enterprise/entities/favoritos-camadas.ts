import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface FavoritosCamadasProps {
  COD_USER_ID: string;
  COD_CAMADA_ID: string;
  DHS_INCLUSAO: string;
}

export class FavoritosCamadas extends AggregateRoot<FavoritosCamadasProps> {
  get user() {
    return this.props.COD_USER_ID;
  }

  get camada() {
    return this.props.COD_CAMADA_ID;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  setUser(userId: string) {
    this.props.COD_USER_ID = userId;
  }

  setCamada(camadaId: string) {
    this.props.COD_CAMADA_ID = camadaId;
  }

  static create(props, id?: UniqueEntityID) {
    const favoritos = new FavoritosCamadas(
      {
        ...props,
      },
      id,
    );
    return favoritos;
  }
}
