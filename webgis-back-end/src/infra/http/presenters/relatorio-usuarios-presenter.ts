import { RelatorioUsuariosData } from '@/domain/relatorios/application/repositories/relatorios-repository';

export class RelatorioUsuariosPresenter {
  static toHTTP(data: RelatorioUsuariosData) {
    return data;
  }
}
