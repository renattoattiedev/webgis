import { Componente } from '@/domain/manager/enterprise/entities/componente';

export class ComponentePresenter {
  static toHTTP(componente: Componente) {
    return {
      id: componente.id.toString(),
      nome: componente.nome,
      descricao: componente.descricao,
      configuracao: componente.configuracao,
      habilitado: componente.habilitado,
    };
  }
}
