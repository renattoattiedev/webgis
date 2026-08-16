import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface CamadasLogProps {
  COD_CAMADA_ID: string;
  DHS_ACESSO: string;
}

export class CamadasLog extends AggregateRoot<CamadasLogProps> {
  get codCamada() {
    return this.props.COD_CAMADA_ID;
  }

  get acesso() {
    return this.props.DHS_ACESSO;
  }

  setCodCamada(codCamada: string) {
    this.props.COD_CAMADA_ID = codCamada;
  }

  setAcesso(acesso: string) {
    this.props.DHS_ACESSO = acesso;
  }

  static create(props, id?: UniqueEntityID) {
    const camada = new CamadasLog(
      {
        ...props,
      },
      id,
    );
    return camada;
  }
}
