import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface SicatBairroProps {
  cd_cidade: number;
  cd_bairro: number;
  dc_bairro?: string | null;
  cd_mun_impressao?: number | null;
}

export class SicatBairro extends Entity<SicatBairroProps> {
  get codigoCidade() {
    return this.props.cd_cidade;
  }

  get codigoBairro() {
    return this.props.cd_bairro;
  }

  get nomeBairro() {
    return this.props.dc_bairro;
  }

  get codigoMunicipioImpressao() {
    return this.props.cd_mun_impressao;
  }

  static create(props: SicatBairroProps, id?: UniqueEntityID) {
    const sicatBairro = new SicatBairro(
      {
        ...props,
      },
      id,
    );

    return sicatBairro;
  }
}
