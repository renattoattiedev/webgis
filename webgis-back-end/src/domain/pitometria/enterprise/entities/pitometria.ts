import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export type TipoPitometria = 'VAZAO' | 'PRESSAO';

export interface PitometriaProps {
  COD_SIMP: string;
  MATRICULA: string;
  TIPO: TipoPitometria;
  longitude?: number | null;
  latitude?: number | null;
  COD_USUARIO_CRIACAO: string;
  DHS_CRIACAO: Date;
  COD_USUARIO_ATUALIZACAO?: string | null;
  DHS_ATUALIZACAO?: Date | null;
  DHS_EXCLUSAO?: Date | null;
}

export class Pitometria extends Entity<PitometriaProps> {
  get codigoSimp() {
    return this.props.COD_SIMP;
  }

  get matricula() {
    return this.props.MATRICULA;
  }

  get tipo() {
    return this.props.TIPO;
  }

  get longitude() {
    return this.props.longitude ?? null;
  }

  get latitude() {
    return this.props.latitude ?? null;
  }

  get usuarioCriacao() {
    return this.props.COD_USUARIO_CRIACAO;
  }

  get criadoEm() {
    return this.props.DHS_CRIACAO;
  }

  get usuarioAtualizacao() {
    return this.props.COD_USUARIO_ATUALIZACAO ?? null;
  }

  get atualizadoEm() {
    return this.props.DHS_ATUALIZACAO ?? null;
  }

  get excluidoEm() {
    return this.props.DHS_EXCLUSAO ?? null;
  }

  setCampos(
    codigoSimp: string,
    matricula: string,
    tipo: TipoPitometria,
    usuarioAtualizacao: string,
  ) {
    this.props.COD_SIMP = codigoSimp;
    this.props.MATRICULA = matricula;
    this.props.TIPO = tipo;
    this.props.COD_USUARIO_ATUALIZACAO = usuarioAtualizacao;
    this.props.DHS_ATUALIZACAO = new Date();
  }

  setGeometria(
    longitude: number,
    latitude: number,
    usuarioAtualizacao: string,
  ) {
    this.props.longitude = longitude;
    this.props.latitude = latitude;
    this.props.COD_USUARIO_ATUALIZACAO = usuarioAtualizacao;
    this.props.DHS_ATUALIZACAO = new Date();
  }

  excluir(usuarioExclusao: string) {
    this.props.DHS_EXCLUSAO = new Date();
    this.props.COD_USUARIO_ATUALIZACAO = usuarioExclusao;
    this.props.DHS_ATUALIZACAO = new Date();
  }

  static create(props: PitometriaProps, id?: UniqueEntityID) {
    return new Pitometria(props, id);
  }
}
