import { RelatorioUsoData } from '@/domain/relatorios/application/repositories/relatorios-repository';

export class RelatorioUsoPresenter {
  static toHTTP(data: RelatorioUsoData) {
    return data;
  }
}
