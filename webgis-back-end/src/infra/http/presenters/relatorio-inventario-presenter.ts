import { RelatorioInventarioData } from '@/domain/relatorios/application/repositories/relatorios-repository';

export class RelatorioInventarioPresenter {
  static toHTTP(data: RelatorioInventarioData) {
    return data;
  }
}
