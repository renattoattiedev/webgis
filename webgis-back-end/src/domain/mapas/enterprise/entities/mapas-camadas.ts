import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface MapasCamadasProps {
  COD_MAPA_CAMADA_ID?: string;
  COD_MAPA_ID: string;
  COD_CAMADA_ID: string;
  NUM_ORDEM_RENDERIZACAO: number;
}

export class MapasCamadas extends Entity<MapasCamadasProps> {
  get codMapaCamadaId() {
    return this.props.COD_MAPA_CAMADA_ID;
  }

  get codMapaId() {
    return this.props.COD_MAPA_ID;
  }

  get codCamadaId() {
    return this.props.COD_CAMADA_ID;
  }

  get numOrdemRenderizacao() {
    return this.props.NUM_ORDEM_RENDERIZACAO;
  }

  setCodMapaId(codMapaId: string) {
    this.props.COD_MAPA_ID = codMapaId;
  }

  setCodCamadaId(codCamadaId: string) {
    this.props.COD_CAMADA_ID = codCamadaId;
  }

  setNumOrdemRenderizacao(numOrdemRenderizacao: number) {
    this.props.NUM_ORDEM_RENDERIZACAO = numOrdemRenderizacao;
  }

  static create(props: MapasCamadasProps, id?: UniqueEntityID) {
    const mapasCamadas = new MapasCamadas(props, id);
    return mapasCamadas;
  }
}
