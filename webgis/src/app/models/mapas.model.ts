import { Camadas } from './camadas.model';
import { CamadasRaster } from './camadas.raster.model';
import { GrupoItem } from './grupo-item.model';

export interface CamadaComOrdem extends Camadas {
  ordemRenderizacao: number;
}

export interface CamadaRasterComOrdem extends CamadasRaster {
  ordemRenderizacao: number;
}

export interface Mapas {
  id: string;
  nomeMapa: string;
  tituloMapa: string;
  descricaoMapa: string;
  boundingBoxMapa: string;
  nivelCompartilhamento: string;
  nivelCompartilhamentoMapa: string;
  grupoMapa: string;
  grupoMapaNome: string;
  camadas: CamadaComOrdem[];
  camadasRaster: CamadaRasterComOrdem[];
  temaId: string;
  temaMapaNome: string;
  favorito: boolean;
  criadoEm: Date;
  updatedAt: Date;
  usrCriacao: string;
  visivel: boolean;
  mapaAtivo: boolean;
  carregamentoDefault: boolean;
  gruposAdicionaisIds?: string[];
  grupos?: GrupoItem[];
}

export interface MapaResponse {
  props: {
    DSC_TITULO: string;
    NOM_NOME_MAPA: string;
    DSC_DESCRICAO: string;
    NIVEL_COMPATILHAMENTO: string;
    GRUPOS_MAPAS: string;
    DSC_BOUNDING_BOX: string;
    [key: string]: any; // Para quaisquer outros campos adicionais que possam vir
  };
  _id: {
    value: string;
  };
  _domainEvents: any[];
}

export interface RespostaApi {
  mapas: Mapas[];
}
