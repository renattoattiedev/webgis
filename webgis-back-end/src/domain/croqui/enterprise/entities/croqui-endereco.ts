import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface CroquiEnderecoProps {
  matricula_imovel: number;
  dv?: number | null;
  nome_cliente_interno?: string | null;
  sigla_logradouro?: string | null;
  dc_logradouro?: string | null;
  numero_endereco?: string | null;
  dc_bairro?: string | null;
  dc_cidade?: string | null;
}

export class CroquiEndereco extends Entity<CroquiEnderecoProps> {
  get matriculaImovel() {
    return this.props.matricula_imovel;
  }

  get dv() {
    return this.props.dv;
  }

  get nomeClienteInterno() {
    return this.props.nome_cliente_interno;
  }

  get siglaLogradouro() {
    return this.props.sigla_logradouro;
  }

  get logradouro() {
    return this.props.dc_logradouro;
  }

  get numeroEndereco() {
    return this.props.numero_endereco;
  }

  get bairro() {
    return this.props.dc_bairro;
  }

  get cidade() {
    return this.props.dc_cidade;
  }

  get enderecoCompleto() {
    const partes = [
      this.props.sigla_logradouro,
      this.props.dc_logradouro,
      this.props.numero_endereco ? `nº ${this.props.numero_endereco}` : null,
      this.props.dc_bairro,
      this.props.dc_cidade,
    ].filter(Boolean);

    return partes.join(', ');
  }

  get identificacaoImovel() {
    return this.props.dv
      ? `${this.props.matricula_imovel}-${this.props.dv}`
      : this.props.matricula_imovel.toString();
  }

  static create(props: CroquiEnderecoProps, id?: UniqueEntityID) {
    return new CroquiEndereco(
      {
        ...props,
      },
      id,
    );
  }
}
