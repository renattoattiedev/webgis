import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface MapasCamadasRasterProps {
  COD_MAPA_CAMADA_RASTER_ID?: string;
  COD_MAPA_ID: string;
  COD_CAMADA_RASTER_ID: string;
  NUM_ORDEM_RENDERIZACAO: number;
}

export class MapasCamadasRaster extends Entity<MapasCamadasRasterProps> {
  get codMapaCamadaId() {
    return this.props.COD_MAPA_CAMADA_RASTER_ID;
  }

  get codMapaId() {
    return this.props.COD_MAPA_ID;
  }

  get codCamadaId() {
    return this.props.COD_CAMADA_RASTER_ID;
  }

  get numOrdemRenderizacao() {
    return this.props.NUM_ORDEM_RENDERIZACAO;
  }

  setCodMapaId(codMapaId: string) {
    this.props.COD_MAPA_ID = codMapaId;
  }

  setCodCamadaId(codCamadaId: string) {
    this.props.COD_CAMADA_RASTER_ID = codCamadaId;
  }

  setNumOrdemRenderizacao(numOrdemRenderizacao: number) {
    this.props.NUM_ORDEM_RENDERIZACAO = numOrdemRenderizacao;
  }

  static create(props: MapasCamadasRasterProps, id?: UniqueEntityID) {
    const mapasCamadasRaster = new MapasCamadasRaster(props, id);
    return mapasCamadasRaster;
  }
}
