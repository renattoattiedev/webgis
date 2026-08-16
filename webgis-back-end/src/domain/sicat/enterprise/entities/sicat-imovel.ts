import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface SicatImovelProps {
  matricula_imovel: number;
  dv?: number | null;
  cliente_especial?: string | null;
  data_ligacao_agua?: Date | null;
  data_ligacao_esgoto?: Date | null;
  numero_economias?: number | null;
  tratamento_esgoto?: string | null;
  ciclo_leitura?: number | null;
  seq_rota?: number | null;
  cep?: number | null;
  cd_logradouro?: number | null;
  cd_cidade?: number | null;
  cd_bairro?: number | null;
  row_version?: number | null;
  numero_endereco?: string | null;
  complemento_endereco?: string | null;
  grupo_consumo?: number | null;
  cd_cliente?: number | null;
  categoria?: number | null;
  otr_fonte?: number | null;
  tp_ligacao_agua?: number | null;
  sit_ligacao_agua?: number | null;
  sit_ligacao_esgoto?: number | null;
}

export class SicatImovel extends Entity<SicatImovelProps> {
  get matriculaImovel() {
    return this.props.matricula_imovel;
  }

  get dv() {
    return this.props.dv;
  }

  get clienteEspecial() {
    return this.props.cliente_especial;
  }

  get dataLigacaoAgua() {
    return this.props.data_ligacao_agua;
  }

  get dataLigacaoEsgoto() {
    return this.props.data_ligacao_esgoto;
  }

  get numeroEconomias() {
    return this.props.numero_economias;
  }

  get numeroEndereco() {
    return this.props.numero_endereco;
  }

  get complementoEndereco() {
    return this.props.complemento_endereco;
  }

  get codigoCliente() {
    return this.props.cd_cliente;
  }

  get codigoCidade() {
    return this.props.cd_cidade;
  }

  get codigoBairro() {
    return this.props.cd_bairro;
  }

  get codigoLogradouro() {
    return this.props.cd_logradouro;
  }

  get cep() {
    return this.props.cep;
  }

  static create(props: SicatImovelProps, id?: UniqueEntityID) {
    const sicatImovel = new SicatImovel(
      {
        ...props,
      },
      id,
    );

    return sicatImovel;
  }
}
