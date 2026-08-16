export interface SolicitacaoServicosDetalhadaResponse {
  numSs: string;
  servico: string;
  operacional: string;
  unidade: string;
  cliente: string;
  cpfCnpj: string;
  matricula: string;
  dv: string;
  hidrometro: string;
  logradouro: string;
  numImovel: string;
  telefone: string;
  bairro: string;
  referencia: string;
  obs: string;
  cdAtendimento: string;
  refAtendimento: string;
  seqSs: string;
}

export interface RespostaApiSolicitacaoServicosDetalhada {
  solicitacao?: SolicitacaoServicosDetalhadaResponse;
  solicitacoes?: SolicitacaoServicosDetalhadaResponse[];
  success?: boolean;
  message?: string;
}

export class SolicitacaoServicosDetalhadaPresenter {
  static toHTTP(raw: any): SolicitacaoServicosDetalhadaResponse {
    return {
      numSs: raw.numSs?.toString() ?? '',
      servico: raw.servico?.toString() ?? '',
      operacional: raw.operacional?.toString() ?? '',
      unidade: raw.unidade?.toString() ?? '',
      cliente: raw.cliente?.toString() ?? '',
      cpfCnpj: raw.cpfCnpj?.toString() ?? '',
      matricula: raw.matricula?.toString() ?? '',
      dv: raw.dv?.toString() ?? '',
      hidrometro: raw.hidrometro?.toString() ?? '',
      logradouro: raw.logradouro?.toString() ?? '',
      numImovel: raw.numImovel?.toString() ?? '',
      telefone: raw.telefone?.toString() ?? '',
      bairro: raw.bairro?.toString() ?? '',
      referencia: raw.referencia?.toString() ?? '',
      obs:
        raw.obs?.toString() ??
        raw.observacao?.toString() ??
        raw.observacoes?.toString() ??
        '',
      cdAtendimento: raw.cdAtendimento?.toString() ?? '',
      refAtendimento: raw.refAtendimento?.toString() ?? '',
      seqSs: raw.seqSs?.toString() ?? '',
    };
  }
}
