export interface ImovelDetalhado {
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

export interface RespostaApiSicatImovel {
  // Back-end pode responder como "imovel" (versão antiga) ou "imovelDetalhado" (versão atual)
  imovel?: ImovelDetalhado;
  imovelDetalhado?: ImovelDetalhado;
  success?: boolean;
  message?: string;
}
