import { SicatCliente } from '@/domain/sicat/enterprise/entities/sicat-cliente';

export class SicatClientePresenter {
  static toHTTP(sicatCliente: SicatCliente) {
    return {
      codigoCliente: sicatCliente.codigoCliente,
      nomeCliente: sicatCliente.nomeClienteInterno,
      cpfCnpj: sicatCliente.cpfCnpj,
      tipoCliente: sicatCliente.tipoCliente,
    };
  }
}
