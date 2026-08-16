import { Grupo } from '@/domain/manager/enterprise/entities/grupo';

export class GrupoPresenter {
  static toHTTP(grupo: Grupo) {
    return {
      id: grupo.id.toString(),
      grupoNome: grupo.grupoNome,
      grupoSigla: grupo.grupoSigla,
      grupoTema: grupo.grupoTema,
      criadoEm: grupo.createdAt,
      updatedAt: grupo.updatedAt,
    };
  }
}
