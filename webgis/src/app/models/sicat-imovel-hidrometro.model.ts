export interface SicatImovelHidrometroDetalhado {
  matriculaImovel: number;
  codigoHidrometro: string;
  nomeClienteInterno: string;
  siglaLogradouro: string;
  descricaoLogradouro: string;
  numeroEndereco: string;
  descricaoBairro: string;
  descricaoCidade: string;
  enderecoCompleto: string;
}

export interface RespostaApiSicatImovelHidrometro {
  imovelDetalhado: SicatImovelHidrometroDetalhado;
  success: boolean;
  message: string;
}
