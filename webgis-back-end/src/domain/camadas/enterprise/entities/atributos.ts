import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';

export interface AtributosProps {
  COD_CAMADA_ID: string;
  NOM_NOME_ATRIBUTO: string;
  DSC_LABEL_ATRIBUTO: string;
  DSC_TIPO: string;
  NUM_TAMANHO: number;
  FLG_VISIVEL: boolean;
  TXT_DESCRICAO: string;
  NUM_ORDEM_RENDERIZACAO?: number;
  COD_USUARIO_CRIACAO: string;
  COD_USUARIO_ULTIMA_ALTERACAO?: string;
  DHS_INCLUSAO: Date;
  DHS_ULTIMA_ALTERACAO?: Date | null;
  COD_USUARIO_EXCLUSAO?: string | null;
  DHS_EXCLUSAO?: Date | null;
}

export class Atributos extends AggregateRoot<AtributosProps> {
  get camadaId() {
    return this.props.COD_CAMADA_ID;
  }

  get atributoNome() {
    return this.props.NOM_NOME_ATRIBUTO;
  }

  get atributoLabel() {
    return this.props.DSC_LABEL_ATRIBUTO;
  }

  get atributoTipo() {
    return this.props.DSC_TIPO;
  }

  get atributoTamanho() {
    return this.props.NUM_TAMANHO;
  }

  get atributoVisivel() {
    return this.props.FLG_VISIVEL;
  }

  get atributoDescricao() {
    return this.props.TXT_DESCRICAO;
  }

  get atributoOrdemRenderizacao() {
    return this.props.NUM_ORDEM_RENDERIZACAO;
  }

  get atributoUsuarioCriacao() {
    return this.props.COD_USUARIO_CRIACAO;
  }

  get atributoUsuarioUltimaAlteracao() {
    return this.props.COD_USUARIO_ULTIMA_ALTERACAO;
  }

  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  setCamadaId(camadaId: string) {
    this.props.COD_CAMADA_ID = camadaId;
    this.touch();
  }

  setAtributoNome(atributoNome: string) {
    this.props.NOM_NOME_ATRIBUTO = atributoNome;
    this.touch();
  }

  setAtributoLabel(atributoLabel: string) {
    this.props.DSC_LABEL_ATRIBUTO = atributoLabel;
    this.touch();
  }

  setAtributoTipo(atributoTipo: string) {
    this.props.DSC_TIPO = atributoTipo;
    this.touch();
  }

  setAtributoTamanho(atributoTamanho: number) {
    this.props.NUM_TAMANHO = atributoTamanho;
    this.touch();
  }

  setAtributoVisivel(atributoVisivel: boolean) {
    this.props.FLG_VISIVEL = atributoVisivel;
    this.touch();
  }

  setAtributoDescricao(atributoDescricao: string) {
    this.props.TXT_DESCRICAO = atributoDescricao;
    this.touch();
  }

  setAtributoOrdemRenderizacao(atributoOrdemRenderizacao: number) {
    this.props.NUM_ORDEM_RENDERIZACAO = atributoOrdemRenderizacao;
    this.touch();
  }

  setAtributoUsuarioCriacao(atributoUsuarioCriacao: string) {
    this.props.COD_USUARIO_CRIACAO = atributoUsuarioCriacao;
    this.touch();
  }

  setAtributoUsuarioUltimaAlteracao(atributoUsuarioUltimaAlteracao: string) {
    this.props.COD_USUARIO_ULTIMA_ALTERACAO = atributoUsuarioUltimaAlteracao;
    this.touch();
  }

  get atributoUsuarioExclusao() {
    return this.props.COD_USUARIO_EXCLUSAO ?? null;
  }

  get deletedAt() {
    return this.props.DHS_EXCLUSAO ?? null;
  }

  get atributoExcluido(): boolean {
    return !!this.props.DHS_EXCLUSAO;
  }

  excluir(usuarioId: string) {
    this.props.DHS_EXCLUSAO = new Date();
    this.props.COD_USUARIO_EXCLUSAO = usuarioId;
    this.touch();
  }

  /** Reentrada: coluna que voltou a existir no PostGIS reativa o atributo antigo, preservando label, ordem e visibilidade. */
  restaurar(usuarioId: string) {
    this.props.DHS_EXCLUSAO = null;
    this.props.COD_USUARIO_EXCLUSAO = null;
    this.props.COD_USUARIO_ULTIMA_ALTERACAO = usuarioId;
    this.touch();
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  static create(
    props: Optional<AtributosProps, 'DHS_ULTIMA_ALTERACAO'>,
    id?: UniqueEntityID,
  ) {
    const atributo = new Atributos(
      {
        ...props,
        DHS_INCLUSAO: props.DHS_INCLUSAO ?? new Date(),
      },
      id,
    );
    return atributo;
  }
}
