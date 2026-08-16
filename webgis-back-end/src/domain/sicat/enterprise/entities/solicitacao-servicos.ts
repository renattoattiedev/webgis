import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface SolicitacaoServicosProps {
  numSs?: string | null;
  servico?: string | null;
  operacional?: string | null;
  unidade?: string | null;
  cliente?: string | null;
  cpfCnpj?: string | null;
  matricula?: string | null;
  dv?: bigint | null;
  hidrometro?: string | null;
  logradouro?: string | null;
  numImovel?: string | null;
  telefone?: string | null;
  bairro?: string | null;
  referencia?: string | null;
  obs?: string | null;
  cdAtendimento?: bigint | null;
  refAtendimento?: bigint | null;
  seqSs?: bigint | null;
}

export class SolicitacaoServicos extends Entity<SolicitacaoServicosProps> {
  get numSs() {
    return this.props.numSs;
  }

  get servico() {
    return this.props.servico;
  }

  get operacional() {
    return this.props.operacional;
  }

  get unidade() {
    return this.props.unidade;
  }

  get cliente() {
    return this.props.cliente;
  }

  get cpfCnpj() {
    return this.props.cpfCnpj;
  }

  get matricula() {
    return this.props.matricula;
  }

  get dv() {
    return this.props.dv;
  }

  get hidrometro() {
    return this.props.hidrometro;
  }

  get logradouro() {
    return this.props.logradouro;
  }

  get numImovel() {
    return this.props.numImovel;
  }

  get telefone() {
    return this.props.telefone;
  }

  get bairro() {
    return this.props.bairro;
  }

  get referencia() {
    return this.props.referencia;
  }

  get obs() {
    return this.props.obs;
  }

  get cdAtendimento() {
    return this.props.cdAtendimento;
  }

  get refAtendimento() {
    return this.props.refAtendimento;
  }

  get seqSs() {
    return this.props.seqSs;
  }

  static create(props: SolicitacaoServicosProps, id?: UniqueEntityID) {
    const solicitacaoServicos = new SolicitacaoServicos(props, id);

    return solicitacaoServicos;
  }
}
