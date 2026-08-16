import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface CamadasRasterLogProps {
  COD_CAMADA_RASTER_ID: string;
  DHS_ACESSO: string;
}

export class CamadasRasterLog extends AggregateRoot<CamadasRasterLogProps> {
  isLeft() {
    throw new Error('Method not implemented.');
  }
  get codCamada() {
    return this.props.COD_CAMADA_RASTER_ID;
  }

  get acesso() {
    return this.props.DHS_ACESSO;
  }

  setCodCamada(codCamada: string) {
    this.props.COD_CAMADA_RASTER_ID = codCamada;
  }

  setAcesso(acesso: string) {
    this.props.DHS_ACESSO = acesso;
  }

  static create(props, id?: UniqueEntityID) {
    const camada = new CamadasRasterLog(
      {
        ...props,
      },
      id,
    );
    return camada;
  }
}
