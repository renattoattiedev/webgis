import { SicatImovel } from '@/domain/sicat/enterprise/entities/sicat-imovel';

export class SicatImovelPresenter {
  static toHTTP(sicatImovel: SicatImovel) {
    return {
      id: sicatImovel.id.toString(),
      matriculaImovel: sicatImovel.matriculaImovel,
      dv: sicatImovel.dv,
      numeroEndereco: sicatImovel.numeroEndereco,
      complementoEndereco: sicatImovel.complementoEndereco,
      codigoCliente: sicatImovel.codigoCliente,
      codigoCidade: sicatImovel.codigoCidade,
      codigoBairro: sicatImovel.codigoBairro,
      codigoLogradouro: sicatImovel.codigoLogradouro,
      cep: sicatImovel.cep,
      numeroEconomias: sicatImovel.numeroEconomias,
    };
  }
}
