import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface ConfigProps {
  NUM_GRUPO_ORDER: number;
  NUM_KEY_ORDER: number;
  DSC_GRUPO_KEY: string;
  DSC_KEY: string;
  DSC_VALUE: string | null;
  FLG_SENSIVEL: boolean | false;
  COD_USUARIO_CRIACAO: string;
  COD_USUARIO_ULTIMA_ALTERACAO: string | null;
  COD_USUARIO_EXCLUSAO: string | null;
  DHS_EXCLUSAO: Date | null;
  DHS_INCLUSAO: Date;
  DHS_ULTIMA_ALTERACAO: Date | null;
}

export class Config extends Entity<ConfigProps> {
  get configGroupOrder() {
    return this.props.NUM_GRUPO_ORDER;
  }

  get configKeyOrder() {
    return this.props.NUM_KEY_ORDER;
  }

  get configGroupKey() {
    return this.props.DSC_GRUPO_KEY;
  }
  get configKey() {
    return this.props.DSC_KEY;
  }

  get configValue() {
    return this.props.DSC_VALUE;
  }

  get configUsuarioCriacao() {
    return this.props.COD_USUARIO_CRIACAO;
  }

  get configUsuarioExclusao() {
    return this.props.COD_USUARIO_EXCLUSAO;
  }

  get configUsuarioUltimaAlteracao() {
    return this.props.COD_USUARIO_ULTIMA_ALTERACAO;
  }

  get configCreatedAt() {
    return this.props.DHS_INCLUSAO;
  }

  get configUpdatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  get configDeletedAt() {
    return this.props.DHS_EXCLUSAO;
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  setConfigGroupOrder(configGroupOrder: number) {
    this.props.NUM_GRUPO_ORDER = configGroupOrder;
    this.touch();
  }

  setConfigKeyOrder(configKeyOrder: number) {
    this.props.NUM_KEY_ORDER = configKeyOrder;
    this.touch();
  }

  setConfigGroupKey(configGroupKey: string) {
    this.props.DSC_GRUPO_KEY = configGroupKey;
    this.touch();
  }

  setConfigKey(configKey: string) {
    this.props.DSC_KEY = configKey;
    this.touch();
  }

  setConfigValue(configValue: string) {
    this.props.DSC_VALUE = configValue;
    this.touch();
  }

  setCamadaUsuarioCriacao(camadaUsuarioCriacao: string) {
    this.props.COD_USUARIO_CRIACAO = camadaUsuarioCriacao;
    this.touch();
  }

  setCamadaUsuarioAlteracao(camadaUsuarioAlteracao: string) {
    this.props.COD_USUARIO_ULTIMA_ALTERACAO = camadaUsuarioAlteracao;
    this.touch();
  }

  setCamadaUsuarioExclusao(camadaUsuarioExclusao: string) {
    this.props.COD_USUARIO_EXCLUSAO = camadaUsuarioExclusao;
    this.touch();
  }

  get isSensitive() {
    return this.props.FLG_SENSIVEL;
  }

  setIsSensitive(isSensitive: boolean) {
    this.props.FLG_SENSIVEL = isSensitive;
    this.touch();
  }

  static create(props: ConfigProps, id?: UniqueEntityID) {
    const config = new Config(props, id);

    return config;
  }
}
