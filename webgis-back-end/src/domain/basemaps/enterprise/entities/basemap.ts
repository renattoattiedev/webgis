import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface BasemapProps {
  NOM_NOME_BASEMAP: string;
  DSC_THUMBNAIL?: string | null;
  DSC_SOURCE: string;
  JSON_WMS_PARAMS?: any;
  NUM_ORDEM: number;
  BOL_DEFAULT: boolean;
  FLG_ATIVO: boolean;
  COD_USUARIO_CRIACAO: string;
  COD_USUARIO_ULTIMA_ALTERACAO?: string | null;
  COD_USUARIO_EXCLUSAO?: string | null;
  DHS_EXCLUSAO?: Date | null;
  DHS_INCLUSAO: Date;
  DHS_ULTIMA_ALTERACAO?: Date | null;
}

export class Basemap extends Entity<BasemapProps> {
  get basemapNome() {
    return this.props.NOM_NOME_BASEMAP;
  }

  get basemapThumbnail() {
    return this.props.DSC_THUMBNAIL ?? null;
  }

  get basemapSource() {
    return this.props.DSC_SOURCE;
  }

  get basemapWmsParams() {
    return this.props.JSON_WMS_PARAMS ?? null;
  }

  get basemapOrdem() {
    return this.props.NUM_ORDEM;
  }

  get basemapDefault() {
    return this.props.BOL_DEFAULT;
  }

  get basemapAtivo() {
    return this.props.FLG_ATIVO;
  }

  get basemapUsuarioCriacao() {
    return this.props.COD_USUARIO_CRIACAO;
  }

  get basemapUsuarioAlteracao() {
    return this.props.COD_USUARIO_ULTIMA_ALTERACAO ?? null;
  }

  get basemapUsuarioExclusao() {
    return this.props.COD_USUARIO_EXCLUSAO ?? null;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO ?? null;
  }

  get deletedAt() {
    return this.props.DHS_EXCLUSAO ?? null;
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  setBasemapNome(nome: string) {
    this.props.NOM_NOME_BASEMAP = nome;
    this.touch();
  }

  setBasemapThumbnail(thumbnail: string | null) {
    this.props.DSC_THUMBNAIL = thumbnail;
    this.touch();
  }

  setBasemapSource(source: string) {
    this.props.DSC_SOURCE = source;
    this.touch();
  }

  setBasemapWmsParams(wmsParams: any) {
    this.props.JSON_WMS_PARAMS = wmsParams ?? null;
    this.touch();
  }

  setBasemapOrdem(ordem: number) {
    this.props.NUM_ORDEM = ordem;
    this.touch();
  }

  setBasemapDefault(isDefault: boolean) {
    this.props.BOL_DEFAULT = isDefault;
    this.touch();
  }

  setBasemapAtivo(ativo: boolean) {
    this.props.FLG_ATIVO = ativo;
    this.touch();
  }

  setBasemapUsuarioAlteracao(codUser: string) {
    this.props.COD_USUARIO_ULTIMA_ALTERACAO = codUser;
    this.touch();
  }

  setBasemapExcluido(codUser: string) {
    this.props.COD_USUARIO_EXCLUSAO = codUser;
    this.props.DHS_EXCLUSAO = new Date();
    this.touch();
  }

  static create(props: BasemapProps, id?: UniqueEntityID) {
    return new Basemap(props, id);
  }
}
