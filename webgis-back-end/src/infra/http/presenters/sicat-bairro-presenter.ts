import { SicatBairro } from '@/domain/sicat/enterprise/entities/sicat-bairro';

export class SicatBairroPresenter {
  static toHTTP(sicatBairro: SicatBairro) {
    return {
      codigoBairro: sicatBairro.codigoBairro,
      bairro: sicatBairro.nomeBairro,
    };
  }
}
