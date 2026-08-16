import { AggregateRoot } from '@/core/entities/aggregate-root';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Optional } from '@/core/types/optional';
import { Camadas } from '../../../camadas/enterprise/entities/camadas';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

export interface MapasProps {
  GRUPOS_MAPAS: string;
  NIVEL_COMPATILHAMENTO: string;
  NOM_NOME_MAPA: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_BOUNDING_BOX?: string | null;
  USUARIO_CRIACAO: string;
  COD_USUARIO_ULTIMA_ALTERACAO?: string | null;
  DHS_INCLUSAO: Date;
  DHS_ULTIMA_ALTERACAO?: Date | null;
  DHS_EXCLUSAO?: Date | null;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
  CAMADAS?: Camadas[];
  CAMADAS_RASTER?: CamadasRaster[];
}

export class Mapas extends AggregateRoot<MapasProps> {
  get mapaNome() {
    return this.props.NOM_NOME_MAPA;
  }

  get mapaTitulo() {
    return this.props.DSC_TITULO;
  }

  get mapaDescricao() {
    return this.props.DSC_DESCRICAO;
  }

  get mapaNivelCompartilhamento(): string {
    return this.props.NIVEL_COMPATILHAMENTO;
  }

  get mapaGrupo(): string {
    return this.props.GRUPOS_MAPAS;
  }

  get mapaBoundingBox(): string {
    return this.props.DSC_BOUNDING_BOX || '';
  }

  get mapaUsuarioCriacao(): string {
    return this.props.USUARIO_CRIACAO;
  }

  get mapaUsuarioUltimaAlteracao(): string {
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

  get mapaCamadas() {
    return this.props.CAMADAS;
  }

  get mapaCamadasRaster() {
    return this.props.CAMADAS_RASTER;
  }

  get mapaCarregamentoDefault() {
    return this.props.BOL_CARREGAMENTO_DEFAULT || false;
  }

  setMapNome(mapNome: string) {
    this.props.NOM_NOME_MAPA = mapNome;
    this.touch();
  }

  setMapTitulo(mapTitulo: string) {
    this.props.DSC_TITULO = mapTitulo;
    this.touch();
  }

  setMapDescricao(mapDescricao: string) {
    this.props.DSC_DESCRICAO = mapDescricao;
    this.touch();
  }

  setMapNivelCompartilhamento(mapNivelCompartilhamento: string) {
    this.props.NIVEL_COMPATILHAMENTO = mapNivelCompartilhamento;
    this.touch();
  }

  setMapGrupo(mapGrupo: string) {
    this.props.GRUPOS_MAPAS = mapGrupo;
    this.touch();
  }

  setMapBoundingBox(mapBoundingBox: string) {
    this.props.DSC_BOUNDING_BOX = mapBoundingBox;
    this.touch();
  }

  setMapUsuarioCriacao(mapUsuarioCriacao: string) {
    this.props.USUARIO_CRIACAO = mapUsuarioCriacao;
    this.touch();
  }

  setMapUsuarioUltimaAlteracao(mapUsuarioAlteracao: string) {
    this.props.COD_USUARIO_ULTIMA_ALTERACAO = mapUsuarioAlteracao;
    this.touch();
  }

  setMapCamadas(camadas: Camadas[]) {
    this.props.CAMADAS = camadas;
    this.touch();
  }

  setMapCamadasRaster(camadasRaster: CamadasRaster[]) {
    this.props.CAMADAS_RASTER = camadasRaster;
    this.touch();
  }

  setUpdatedAt(updatedAt: Date) {
    this.props.DHS_ULTIMA_ALTERACAO = updatedAt;
  }

  setMapCarregamentoDefault(mapCarregamentoDefault: boolean) {
    this.props.BOL_CARREGAMENTO_DEFAULT = mapCarregamentoDefault;
    this.touch();
  }

  private touch() {
    this.props.DHS_ULTIMA_ALTERACAO = new Date();
  }

  static create(
    props: Optional<MapasProps, 'DHS_ULTIMA_ALTERACAO'>,
    id?: UniqueEntityID,
  ) {
    const mapa = new Mapas(
      {
        ...props,
        DHS_INCLUSAO: props.DHS_INCLUSAO ?? new Date(),
      },
      id,
    );
    return mapa;
  }
}
