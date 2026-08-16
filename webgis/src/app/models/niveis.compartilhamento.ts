export interface NiveisCompartilhamento {
  id: string;
  descricaoNivelCompartilhamento: string;
  criadoEm: string;
}

export interface RespostaApi {
  nivelCompartilhamento: NiveisCompartilhamento[];
}
