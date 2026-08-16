export interface MapasLog {
  id: string;
  data_acesso: Date;
}

export interface RespostaApi {
  mapas: MapasLog[];
}
