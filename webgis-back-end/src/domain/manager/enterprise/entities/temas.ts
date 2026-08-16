import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface TemasProps {
  NOM_NOME_TEMA: string;
  USUARIO_CRIACAO: string | null;
  DHS_INCLUSAO: Date;
  USUARIO_ALTERACAO: string | null;
  DHS_ULTIMA_ALTERACAO?: Date | null;
}

export class Temas extends Entity<TemasProps> {
  get temaNome() {
    return this.props.NOM_NOME_TEMA;
  }

  get temaUsuarioCriacao(): string | null {
    return this.props.USUARIO_CRIACAO;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get temaUsuarioAlteracao(): string | null {
    return this.props.USUARIO_ALTERACAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  setTemaNome(temasNome: string) {
    this.props.NOM_NOME_TEMA = temasNome;
    this.touch();
  }

  setTemasUsuarioCriacao(temaUsuarioCriacao: string) {
    this.props.USUARIO_CRIACAO = temaUsuarioCriacao;
    this.touch();
  }

  setTemasUsuarioAltercao(temaUsuarioAlteracao: string) {
    this.props.USUARIO_ALTERACAO = temaUsuarioAlteracao;
    this.touch();
  }

  static create(props: TemasProps, id?: UniqueEntityID) {
    const tema = new Temas(props, id);

    return tema;
  }
}
