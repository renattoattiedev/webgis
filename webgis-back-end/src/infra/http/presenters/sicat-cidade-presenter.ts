import { SicatCidade } from '@/domain/sicat/enterprise/entities/sicat-cidades';

export class SicatCidadePresenter {
  static toHTTP(sicatCidade: SicatCidade) {
    return {
      codigoCidade: sicatCidade.codigoCidade,
      cidade: sicatCidade.nomeCidade,
    };
  }
}
