import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface SicatHidrometroImovelProps {
  matriculaImovel: number;
  codigoHidrometro: string;
}

export class SicatHidrometroImovel extends Entity<SicatHidrometroImovelProps> {
  get matriculaImovel() {
    return this.props.matriculaImovel;
  }

  get codigoHidrometro() {
    return this.props.codigoHidrometro;
  }

  static create(props: SicatHidrometroImovelProps, id?: UniqueEntityID) {
    const sicatHidrometroImovel = new SicatHidrometroImovel(props, id);

    return sicatHidrometroImovel;
  }
}
