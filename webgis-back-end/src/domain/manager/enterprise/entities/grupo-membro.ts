import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type GrupoMembroStatus = 'membro' | 'pendente';

export interface GrupoMembroProps {
  COD_GRUPO_ID: string;
  COD_USER_ID: string;
  DSC_STATUS: GrupoMembroStatus;
  USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
  USUARIO_ALTERACAO?: string | null;
  DHS_ULTIMA_ALTERACAO?: Date | null;
  DHS_EXCLUSAO?: Date | null;
  USUARIO_EXCLUSAO?: string | null;
}

export class GrupoMembro extends Entity<GrupoMembroProps> {
  get grupoId() {
    return this.props.COD_GRUPO_ID;
  }

  get userId() {
    return this.props.COD_USER_ID;
  }

  get status(): GrupoMembroStatus {
    return this.props.DSC_STATUS;
  }

  get usuarioCriacao() {
    return this.props.USUARIO_CRIACAO;
  }

  get usuarioAlteracao() {
    return this.props.USUARIO_ALTERACAO ?? null;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  get excluidoEm() {
    return this.props.DHS_EXCLUSAO ?? null;
  }

  get usuarioExclusao() {
    return this.props.USUARIO_EXCLUSAO ?? null;
  }

  get ativo(): boolean {
    return this.excluidoEm === null;
  }

  private touch(por?: string) {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
    if (por) {
      this.props.USUARIO_ALTERACAO = por;
    }
  }

  aprovar(por?: string) {
    this.props.DSC_STATUS = 'membro';
    this.touch(por);
  }

  /** Reativa um vínculo soft-deletado (re-solicitação ou re-adição). */
  reativar(status: GrupoMembroStatus, por?: string) {
    this.props.DSC_STATUS = status;
    this.props.DHS_EXCLUSAO = null;
    this.props.USUARIO_EXCLUSAO = null;
    this.touch(por);
  }

  excluir(usuarioExclusao: string) {
    this.props.DHS_EXCLUSAO = new Date();
    this.props.USUARIO_EXCLUSAO = usuarioExclusao;
    this.touch(usuarioExclusao);
  }

  static create(props: GrupoMembroProps, id?: UniqueEntityID) {
    return new GrupoMembro(props, id);
  }
}
