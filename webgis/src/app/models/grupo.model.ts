import { Camadas } from './camadas.model';
import { CamadasRaster } from './camadas.raster.model';
import { Mapas } from './mapas.model';

export interface Grupos {
  id: string;
  grupoNome: string;
  grupoSigla: string;
  grupoTema: string;
  donoId?: string;
  temaNome: string;
  nomeUsrCriacao: string;
  nomeUsrAlteracao: string;
  visivel: boolean;
  criadoEm: string;
  updatedAt: string;
  camadas: Camadas[];
  camadasRaster: CamadasRaster[];
  mapas: Mapas[];
  deletedAt?: string | null;
}

export interface RespostaApi {
  gruposTema: Grupos[];
}

export interface RespostaApiAllGrupos {
  grupos: Grupos[];
}
