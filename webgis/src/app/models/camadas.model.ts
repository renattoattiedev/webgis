import { Atributos } from './atributos.model';
import { GrupoItem } from './grupo-item.model';

export interface Camadas {
  id: string;
  nomeCamada: string;
  tituloCamada: string;
  temaId: string;
  temaCamadaNome: string;
  grupoCamada: string;
  grupoCamadaNome: string;
  linkMetadados: string;
  descricaoCamada: string;
  pacoteConceitual: string;
  pacoteConceitualNome: string;
  nivelCompartilhamentoId: string;
  nivelCompartilhamento: string;
  tags: string;
  fonteDadosCamada: string;
  termosDeUso: string;
  boundingBox: string;
  criadoEm: string;
  updatedAt: string;
  deletedAt: string;
  usrCriacao: string;
  visivel: boolean;
  atributos: Atributos[] | null;
  camadaAtiva: boolean;
  favorito: boolean;
  tableAttribute: boolean;
  tipo: string;
  carregamentoDefault: boolean;
  gruposAdicionaisIds?: string[];
  grupos?: GrupoItem[];
}

export interface RespostaApi {
  camadas: Camadas[];
}
