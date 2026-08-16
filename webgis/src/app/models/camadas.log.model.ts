export interface CamadasLog {
  id: string;
  data_acesso: Date;
}

export interface RespostaApi {
  camadas: CamadasLog[];
}
