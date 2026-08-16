import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface SicatLogradouroProps {
  cd_cidade: number;
  cd_logradouro: number;
  sigla_logradouro?: string | null;
  dc_logradouro?: string | null;
}

export class SicatLogradouro extends Entity<SicatLogradouroProps> {
  get codigoCidade() {
    return this.props.cd_cidade;
  }

  get codigoLogradouro() {
    return this.props.cd_logradouro;
  }

  get siglaLogradouro() {
    return this.props.sigla_logradouro;
  }

  get nomeLogradouro() {
    return this.props.dc_logradouro;
  }

  get logradouroCompleto() {
    const partes = [
      this.props.sigla_logradouro,
      this.props.dc_logradouro,
    ].filter(Boolean);
    return partes.join(' ');
  }

  static create(props: SicatLogradouroProps, id?: UniqueEntityID) {
    const sicatLogradouro = new SicatLogradouro(
      {
        ...props,
      },
      id,
    );

    return sicatLogradouro;
  }
}
