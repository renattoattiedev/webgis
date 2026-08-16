import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface GrupoProps {
  NOM_NOME_GRUPO: string;
  SGL_GRUPO_ID: string;
  USUARIO_CRIACAO: string;
  COD_TEMA_ID: string;
  DHS_INCLUSAO: Date;
  USUARIO_ALTERACAO: string | null;
  DHS_ULTIMA_ALTERACAO?: Date | null;
  USUARIO_DONO?: string | null;
  DSC_VISIBILIDADE?: string;
  DSC_POLITICA_PARTICIPACAO?: string;
  BOL_MEMBROS_CONTRIBUEM?: boolean;
}

export class Grupo extends Entity<GrupoProps> {
  get grupoNome() {
    return this.props.NOM_NOME_GRUPO;
  }

  get grupoUsuarioCriacao(): string {
    return this.props.USUARIO_CRIACAO;
  }

  get grupoTema(): string {
    return this.props.COD_TEMA_ID;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  get grupoUsuarioAlteracao(): string | null {
    return this.props.USUARIO_ALTERACAO;
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  setGrupoNome(gruposNome: string) {
    this.props.NOM_NOME_GRUPO = gruposNome;
    this.touch();
  }

  get grupoSigla(): string {
    return this.props.SGL_GRUPO_ID;
  }

  setGrupoSigla(sigla: string) {
    this.props.SGL_GRUPO_ID = sigla;
    this.touch();
  }

  setGrupoTema(grupoTema: string) {
    this.props.COD_TEMA_ID = grupoTema;
    this.touch();
  }

  setGrupoUsuarioCriacao(grupoUsuarioCriacao: string) {
    this.props.USUARIO_CRIACAO = grupoUsuarioCriacao;
    this.touch();
  }

  setGrupoUsuarioAlteracao(grupoUsuarioAlteracao: string) {
    this.props.USUARIO_ALTERACAO = grupoUsuarioAlteracao;
    this.touch();
  }

  get grupoDono(): string {
    return this.props.USUARIO_DONO ?? this.props.USUARIO_CRIACAO;
  }

  get grupoVisibilidade(): string {
    return this.props.DSC_VISIBILIDADE ?? 'organizacao';
  }

  get grupoPoliticaParticipacao(): string {
    return this.props.DSC_POLITICA_PARTICIPACAO ?? 'convite';
  }

  get grupoMembrosContribuem(): boolean {
    return this.props.BOL_MEMBROS_CONTRIBUEM ?? false;
  }

  setGrupoDono(dono: string) {
    this.props.USUARIO_DONO = dono;
    this.touch();
  }

  setGrupoVisibilidade(visibilidade: string) {
    this.props.DSC_VISIBILIDADE = visibilidade;
    this.touch();
  }

  setGrupoPoliticaParticipacao(politica: string) {
    this.props.DSC_POLITICA_PARTICIPACAO = politica;
    this.touch();
  }

  setGrupoMembrosContribuem(contribuem: boolean) {
    this.props.BOL_MEMBROS_CONTRIBUEM = contribuem;
    this.touch();
  }

  static create(props: GrupoProps, id?: UniqueEntityID) {
    const grupoCamada = new Grupo(props, id);

    return grupoCamada;
  }
}
