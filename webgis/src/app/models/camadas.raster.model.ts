import { GrupoItem } from './grupo-item.model';

export interface CamadasRaster {
  id: string;
  nomeCamada: string;
  fonteDadosCamadaRaster: string;
  tituloCamada: string;
  temaId: string;
  temaCamadaNome: string;
  grupoCamada: string;
  grupoCamadaNome: string;
  linkMetadados: string;
  descricaoCamada: string;
  nivelCompartilhamentoId: string;
  nivelCompartilhamento: string;
  tags: string;
  termosDeUso: string;
  boundingBox: string;
  criadoEm: string;
  updatedAt: string;
  deletedAt: string;
  usrCriacao: string;
  visivel: boolean;
  camadaAtiva: boolean;
  favorito: boolean;
  tableAttribute: boolean;
  tipo: string;
  carregamentoDefault: boolean;
  status?: 'uploading' | 'converting' | 'publishing' | 'published' | 'error';
  uploadProgress?: number;
  seedStatus?: 'idle' | 'seeding' | 'cached' | 'failed';
  seedProgress?: number;
  cogPerfil?: string;
  gruposAdicionaisIds?: string[];
  grupos?: GrupoItem[];
}

export interface RespostaApi {
  camadasRaster: CamadasRaster[];
}
