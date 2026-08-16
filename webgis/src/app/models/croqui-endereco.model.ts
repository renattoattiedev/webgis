export interface CroquiEndereco {
  matriculaImovel: number;
  dv: number | null;
  nomeClienteInterno: string | null;
  siglaLogradouro: string | null;
  logradouro: string | null;
  numeroEndereco: string | null;
  bairro: string | null;
  cidade: string | null;
  enderecoCompleto: string;
}

export interface RespostaApiEnderecos {
  enderecos: CroquiEndereco[];
  total: number;
}
