import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface NivelCompartilhamentoProps {
  DSC_NIVEL_COMPATILHAMENTO: string;
  USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
  DHS_ULTIMA_ALTERACAO?: Date | null;
}

export class NivelCompartilhamento extends Entity<NivelCompartilhamentoProps> {
  get nivelCompartilhamentoDescricao(): string {
    return this.props.DSC_NIVEL_COMPATILHAMENTO;
  }

  get nivelCompartilhamentoUsuarioCriacao(): string {
    return this.props.USUARIO_CRIACAO;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }
  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }
  setNivelCompartilhamentoDescricao(nivelCompartilhamentoDescricao: string) {
    this.props.DSC_NIVEL_COMPATILHAMENTO = nivelCompartilhamentoDescricao;
    this.touch();
  }

  setNivelCompartilhamentoUsuarioCriacao(
    nivelCompartilhamentoUsuarioCriacao: string,
  ) {
    this.props.USUARIO_CRIACAO = nivelCompartilhamentoUsuarioCriacao;
    this.touch();
  }

  static create(props: NivelCompartilhamentoProps, id?: UniqueEntityID) {
    const nivelCompartilhamento = new NivelCompartilhamento(props, id);

    return nivelCompartilhamento;
  }
}
