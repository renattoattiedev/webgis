import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface MapasLogProps {
  COD_MAPA_ID: string;
  DHS_ACESSO: string;
}

export class MapasLog extends AggregateRoot<MapasLogProps> {
  get codMapa() {
    return this.props.COD_MAPA_ID;
  }

  get acesso() {
    return this.props.DHS_ACESSO;
  }

  setCodMapa(codMapa: string) {
    this.props.COD_MAPA_ID = codMapa;
  }

  setAcesso(acesso: string) {
    this.props.DHS_ACESSO = acesso;
  }

  static create(props, id?: UniqueEntityID) {
    const Mapa = new MapasLog(
      {
        ...props,
      },
      id,
    );
    return Mapa;
  }
}
