export interface SicatCidade {
  codigoCidade: number;
  cidade: string;
}

export interface RespostaApiCidades {
  cidades: SicatCidade[];
}
