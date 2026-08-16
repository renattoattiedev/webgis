export interface TipoConsultaConfig {
  id: string;
  label: string;
  keywords: string[];
}

export interface TipoConsultaDisponivel {
  id: string;
  label: string;
  nomeAtributo: string | null;
}

export interface ConfigCamadaFiltro {
  id: string;
  nomeCamada: string;
  titulo: string;
  colunaPorTipo: Record<string, string>;
  agruparPor?: string;
}

export interface PesquisarCamadasDialogData {
  camadas?: ConfigCamadaFiltro[];
}

export interface CamadaListItem {
  id: string;
  titulo: string;
  tipo: 'camada' | 'raster' | 'mapa';
  grupoNome: string;
  temaNome: string;
  grupoId: string;
  temaId: string;
  nomeCamada?: string;
  fonteDadosCamadaRaster?: string;
  atributosNomes: string[];
}

export type LayerParaBusca = Pick<CamadaListItem, 'id' | 'titulo'> & {
  nomeCamada: string;
  temaId?: string;
  grupoId?: string;
  camadaId?: string;
};
