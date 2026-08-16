import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { Atributos } from './atributos';

export interface CamadasProps {
  NOM_NOME: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  PACOTES_CONCEITUAIS: string;
  DSC_FONTE_DADOS_CAMADA: string;
  DSC_BOUNDING_BOX?: string | null;
  USUARIO_CRIACAO: string;
  COD_USUARIO_ULTIMA_ALTERACAO?: string;
  DHS_INCLUSAO: Date;
  DHS_ULTIMA_ALTERACAO?: Date | null;
  DHS_EXCLUSAO?: Date | null;
  FLG_CAMADA_ATIVA: boolean;
  ATRIBUTOS?: Atributos[];
  BOL_CARREGAMENTO_DEFAULT?: boolean;
  DSC_STATUS?: string | null;
  DSC_ERROR_MSG?: string | null;
}

export class Camadas extends AggregateRoot<CamadasProps> {
  get camadaNome() {
    return this.props.NOM_NOME;
  }

  get camadaTitulo() {
    return this.props.DSC_TITULO;
  }

  get camadaDescricao() {
    return this.props.DSC_DESCRICAO;
  }

  get camadaLinkMetadados(): string {
    return this.props.DSC_LINK_METADADOS;
  }

  get camadaTermosDeUso(): string {
    return this.props.TXT_TERMOS_DE_USO;
  }

  get camadaNivelCompartilhamento(): string {
    return this.props.NIVEL_COMPATILHAMENTO;
  }

  get camadaGruposCamadas(): string {
    return this.props.GRUPOS_CAMADAS;
  }

  get camadaTags(): string {
    return this.props.TXT_TAGS;
  }

  get camadaPacotesConceituais(): string {
    return this.props.PACOTES_CONCEITUAIS;
  }

  get camadaFonteDadosCamada(): string {
    return this.props.DSC_FONTE_DADOS_CAMADA;
  }

  get camadaAtributos(): Atributos[] {
    return this.props.ATRIBUTOS || [];
  }

  get camadaBoundingBox(): string | null {
    return this.props.DSC_BOUNDING_BOX ?? null;
  }

  get camadaUsuarioCriacao(): string {
    return this.props.USUARIO_CRIACAO;
  }

  get camadaUsuarioUltimaAlteracao(): string {
    return this.props.COD_USUARIO_ULTIMA_ALTERACAO ?? '';
  }
  get createdAt() {
    return this.props.DHS_INCLUSAO;
  }

  get updatedAt() {
    return this.props.DHS_ULTIMA_ALTERACAO;
  }

  get deletedAt() {
    return this.props.DHS_EXCLUSAO;
  }

  get camadaAtiva() {
    return this.props.FLG_CAMADA_ATIVA;
  }

  get camadaCarregamentoDefault() {
    return this.props.BOL_CARREGAMENTO_DEFAULT ?? false;
  }

  get camadaStatus(): string {
    return this.props.DSC_STATUS ?? 'published';
  }

  get camadaErrorMsg(): string | null {
    return this.props.DSC_ERROR_MSG ?? null;
  }

  setCamadaNome(camadaNome: string) {
    this.props.NOM_NOME = camadaNome;
    this.touch();
  }

  setCamadaTitulo(camadaTitulo: string) {
    this.props.DSC_TITULO = camadaTitulo;
    this.touch();
  }

  setCamadaDescricao(camadaDescricao: string) {
    this.props.DSC_DESCRICAO = camadaDescricao;
    this.touch();
  }

  setCamadaLinkMetadados(camadaLinkMetadados: string) {
    this.props.DSC_LINK_METADADOS = camadaLinkMetadados;
    this.touch();
  }

  setCamadaTermosDeUso(camadaTermosDeUso: string) {
    this.props.TXT_TERMOS_DE_USO = camadaTermosDeUso;
    this.touch();
  }

  setCamadaNivelCompartilhamento(camadaNivel: string) {
    this.props.NIVEL_COMPATILHAMENTO = camadaNivel;
    this.touch();
  }

  setCamadaGruposCamadas(camadaGrupos: string) {
    this.props.GRUPOS_CAMADAS = camadaGrupos;
    this.touch();
  }

  setCamadaTags(camadaTags: string) {
    this.props.TXT_TAGS = camadaTags;
    this.touch();
  }

  setCamadaPacotesConceituais(camadaPacotesConceituais: string) {
    this.props.PACOTES_CONCEITUAIS = camadaPacotesConceituais;
    this.touch();
  }

  setCamadaFonteDadosCamada(camadaFonteDados: string) {
    this.props.DSC_FONTE_DADOS_CAMADA = camadaFonteDados;
    this.touch();
  }

  setCamadaBoundingBox(camadaBoundingBox: string) {
    this.props.DSC_BOUNDING_BOX = camadaBoundingBox;
    this.touch();
  }

  setCamadaAtributos(camadaAtributos: Atributos[]) {
    this.props.ATRIBUTOS = camadaAtributos;
    this.touch();
  }

  setCamadaUsuarioCriacao(camadaUsuarioCriacao: string) {
    this.props.USUARIO_CRIACAO = camadaUsuarioCriacao;
    this.touch();
  }

  setCamadaUsuarioAlteracao(camadaUsuarioAlteracao: string) {
    this.props.COD_USUARIO_ULTIMA_ALTERACAO = camadaUsuarioAlteracao;
    this.touch();
  }

  setCamadaAtiva(camadaAtiva: boolean) {
    this.props.FLG_CAMADA_ATIVA = camadaAtiva;
    this.touch();
  }

  setCamadaCarregamentoDefault(camadaCarregamentoDefault: boolean) {
    this.props.BOL_CARREGAMENTO_DEFAULT = camadaCarregamentoDefault;
    this.touch();
  }

  setCamadaStatus(camadaStatus: string) {
    this.props.DSC_STATUS = camadaStatus;
    this.touch();
  }

  setCamadaErrorMsg(camadaErrorMsg: string | null) {
    this.props.DSC_ERROR_MSG = camadaErrorMsg
      ? camadaErrorMsg.slice(0, 500)
      : null;
    this.touch();
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  static create(
    props: Optional<CamadasProps, 'DHS_ULTIMA_ALTERACAO'>,
    id?: UniqueEntityID,
  ) {
    const camada = new Camadas(
      {
        ...props,
        DHS_INCLUSAO: props.DHS_INCLUSAO ?? new Date(),
      },
      id,
    );
    return camada;
  }
}
