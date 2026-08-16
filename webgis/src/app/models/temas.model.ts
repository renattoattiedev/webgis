import { Grupos } from './grupo.model';
export interface Tema {
  id: string;
  tituloTema: string;
  criadoEm: string;
  nomeUsrCriacao: string;
  updatedAt: string;
  nomeUsrAlteracao: string;
  grupos: Grupos[];
}

export interface RespostaApi {
  temas: Tema[];
}
