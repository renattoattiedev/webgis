import { NivelCompartilhamento } from '@/domain/manager/enterprise/entities/nivel-compartilhamento';

export class NivelCompartilhamentoPresenter {
  static toHTTP(nivelCompartilhamento: NivelCompartilhamento) {
    return {
      id: nivelCompartilhamento.id.toString(),
      descricaoNivelCompartilhamento:
        nivelCompartilhamento.nivelCompartilhamentoDescricao,
      criadoEm: nivelCompartilhamento.createdAt,
      updatedAt: nivelCompartilhamento.updatedAt,
    };
  }
}
