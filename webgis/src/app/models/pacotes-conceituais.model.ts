export interface PacotesConceituais {
  id: string;
  tituloPacoteConceitual: string;
  nomePacoteConceitual: string;
  criadoEm: string;
  usuarioCriacao: string;
  nomeUsrCriacao: string;
  updatedAt: string;
  usuarioUltimaAlteracao: string;
  nomeUsrAlteracao: string;
  host: string;
  database: string;
  port: string;
  schema: string;
  user: string;
  password: string;
  validadoGeoserver: boolean;
  canEdit: boolean;
  hasSensitiveData: boolean;
  canAccessConnectionData?: boolean;
  accessDenied?: boolean;
}

export interface RespostaApi {
  pacotesConceituais: PacotesConceituais[];
}

export interface ConnectionData {
  host: string;
  port: string;
  database: string;
  schema: string;
  user: string;
  password: string;
}

export interface PacoteConnectionResponse {
  id: string;
  nome: string;
  connectionData: ConnectionData;
  warning: string;
  accessTime: string;
}

export interface PacoteForEdit {
  id: string;
  nome: string;
  titulo: string;
  connectionData: ConnectionData;
  hasSensitiveData: boolean;
  warning: string;
}
