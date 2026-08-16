import { Camadas } from './camadas.model';

export interface FolderCamadas {
  id: string;
  descricao: string;
  usuarioCriacao: string;
  dataCriacao: string;
  usuarioAlteracao: string;
  camadas: Camadas[];
}

export interface Folder {
  id?: string;
  descricao: string;
}

export interface RespostaFolderApi {
  folders: Folder[];
}
