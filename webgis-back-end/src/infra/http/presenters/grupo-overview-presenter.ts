import { GrupoOverviewItem } from '@/domain/manager/application/use-cases/fetch-grupos-overview';

export class GrupoOverviewPresenter {
  static toHTTP(item: GrupoOverviewItem) {
    return {
      id: item.grupo.id.toString(),
      nome: item.grupo.grupoNome,
      sigla: item.grupo.grupoSigla,
      temaId: item.grupo.grupoTema,
      temaNome: item.temaNome,
      donoId: item.grupo.grupoDono,
      visibilidade: item.grupo.grupoVisibilidade,
      politicaParticipacao: item.grupo.grupoPoliticaParticipacao,
      membrosContribuem: item.grupo.grupoMembrosContribuem,
      qtdItens: item.qtdItens,
      qtdItensVisiveis: item.qtdItensVisiveis,
      qtdMembros: item.qtdMembros,
      membership: item.membership,
      podeGerenciar: item.podeGerenciar,
    };
  }
}
