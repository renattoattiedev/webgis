export interface SicatLogradouro {
  codigoLogradouro: string;
  sigla: string;
  logradouro: string;
  logradouroCompleto: string;
}

export interface RespostaApiLogradouros {
  logradouros: SicatLogradouro[];
}
