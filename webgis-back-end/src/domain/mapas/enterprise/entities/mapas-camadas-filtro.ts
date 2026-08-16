import { Entity } from '@/core/entities/entity';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export interface MapasCamadasFiltrosProps {
  COD_MAPA_CAMADA_ID: string;
  DSC_FILTRO: string;
}

export class MapasCamadasFiltros extends Entity<MapasCamadasFiltrosProps> {
  get codMapaCamadaId() {
    return this.props.COD_MAPA_CAMADA_ID;
  }
  get filtroCamadaMapa() {
    return this.props.DSC_FILTRO;
  }

  setCodMapaCamadaId(codMapaCamadaId: string) {
    this.props.COD_MAPA_CAMADA_ID = codMapaCamadaId;
  }

  setFiltroCamadaMapa(filtro: string) {
    this.props.DSC_FILTRO = filtro;
  }

  static create(props: MapasCamadasFiltrosProps, id?: UniqueEntityID) {
    const mapasCamadasFiltros = new MapasCamadasFiltros(props, id);

    return mapasCamadasFiltros;
  }
}
