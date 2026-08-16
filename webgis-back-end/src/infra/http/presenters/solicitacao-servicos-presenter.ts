import { SolicitacaoServicos } from '@/domain/sicat/enterprise/entities/solicitacao-servicos';

export class SolicitacaoServicosPresenter {
  static toHTTP(solicitacaoServicos: SolicitacaoServicos) {
    return {
      numSs: solicitacaoServicos.numSs,
      servico: solicitacaoServicos.servico,
      operacional: solicitacaoServicos.operacional,
      unidade: solicitacaoServicos.unidade,
      cliente: solicitacaoServicos.cliente,
      cpfCnpj: solicitacaoServicos.cpfCnpj,
      matricula: solicitacaoServicos.matricula,
      dv: solicitacaoServicos.dv,
      hidrometro: solicitacaoServicos.hidrometro,
      logradouro: solicitacaoServicos.logradouro,
      numImovel: solicitacaoServicos.numImovel,
      telefone: solicitacaoServicos.telefone,
      bairro: solicitacaoServicos.bairro,
      referencia: solicitacaoServicos.referencia,
      obs: solicitacaoServicos.obs,
      cdAtendimento: solicitacaoServicos.cdAtendimento,
      refAtendimento: solicitacaoServicos.refAtendimento,
      seqSs: solicitacaoServicos.seqSs,
    };
  }
}
