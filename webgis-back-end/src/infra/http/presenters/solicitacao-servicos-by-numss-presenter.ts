export interface SolicitacaoServicosByNumSsResponse {
  seqSs: number;
}

export class SolicitacaoServicosByNumSsPresenter {
  static toHTTP(seqSs: number): SolicitacaoServicosByNumSsResponse {
    return {
      seqSs,
    };
  }
}
