import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface SicatCidadeProps {
  cd_cidade: number;
  cd_municipio: number;
  dc_cidade?: string | null;
}

export class SicatCidade extends Entity<SicatCidadeProps> {
  get codigoCidade() {
    return this.props.cd_cidade;
  }

  get codigoMunicipio() {
    return this.props.cd_municipio;
  }

  get nomeCidade() {
    return this.props.dc_cidade;
  }

  static create(props: SicatCidadeProps, id?: UniqueEntityID) {
    const sicatCidade = new SicatCidade(
      {
        ...props,
      },
      id,
    );

    return sicatCidade;
  }
}
