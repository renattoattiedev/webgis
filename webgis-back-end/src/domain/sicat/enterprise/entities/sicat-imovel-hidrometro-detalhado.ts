export interface SicatImovelHidrometroDetalhado {
  matricula_imovel: number;
  codigo_hidrometro: string;
  nome_cliente_interno: string | null;
  sigla_logradouro: string | null;
  dc_logradouro: string | null;
  numero_endereco: string | null;
  dc_bairro: string | null;
  dc_cidade: string | null;
}
