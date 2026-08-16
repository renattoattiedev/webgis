import { SicatHidrometroImovel } from '@/domain/sicat/enterprise/entities/sicat-hidrometro-imovel';

export class SicatHidrometroImovelPresenter {
  static toHTTP(sicatHidrometroImovel: SicatHidrometroImovel) {
    return {
      id: sicatHidrometroImovel.id.toString(),
      matriculaImovel: sicatHidrometroImovel.matriculaImovel,
      codigoHidrometro: sicatHidrometroImovel.codigoHidrometro,
    };
  }
}
