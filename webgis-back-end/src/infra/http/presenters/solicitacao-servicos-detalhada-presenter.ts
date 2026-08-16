export interface SolicitacaoServicosDetalhadaResponse {
  num_ss: string;
  servico: string | null;
  operacional: string | null;
  unidade: string | null;
  cliente: string | null;
  cpf_cnpj: string | null;
  matricula: string | null;
  dv: string | null;
  hidrometro: string | null;
  logradouro: string | null;
  num_imovel: string | null;
  telefone: string | null;
  bairro: string | null;
  referencia: string | null;
  obs: string | null;
  cd_atendimento: string | null;
  ref_atendimento: string | null;
  seq_ss: string;
}

export class SolicitacaoServicosDetalhadaPresenter {
  static toHTTP(raw: any): SolicitacaoServicosDetalhadaResponse {
    return {
      num_ss: raw.num_ss ?? '',
      servico: raw.servico || null,
      operacional: raw.operacional || null,
      unidade: raw.unidade || null,
      cliente: raw.cliente || null,
      cpf_cnpj: raw.cpf_cnpj || null,
      matricula: raw.matricula || null,
      dv: raw.dv?.toString() || null,
      hidrometro: raw.hidrometro || null,
      logradouro: raw.logradouro || null,
      num_imovel: raw.num_imovel || null,
      telefone: raw.telefone || null,
      bairro: raw.bairro || null,
      referencia: raw.referencia || null,
      obs: raw.obs || null,
      cd_atendimento: raw.cd_atendimento?.toString() || null,
      ref_atendimento: raw.ref_atendimento?.toString() || null,
      seq_ss: raw.seq_ss?.toString() ?? '',
    };
  }
}
