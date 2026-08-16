import { Grupo } from '@/domain/manager/enterprise/entities/grupo';

export class GruposTemaPresenter {
  static toHTTP(grupoCamadasTema: Grupo) {
    return {
      id: grupoCamadasTema.id.toString(),
      grupoNome: grupoCamadasTema.grupoNome,
      grupoSigla: grupoCamadasTema.grupoSigla,
      grupoTema: grupoCamadasTema.grupoTema,
      criadoEm: grupoCamadasTema.createdAt,
      updatedAt: grupoCamadasTema.updatedAt,
    };
  }
}
