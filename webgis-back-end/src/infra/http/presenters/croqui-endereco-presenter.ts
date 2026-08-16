import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';

export class CroquiEnderecoPresenter {
  static toHTTP(croquiEndereco: CroquiEndereco) {
    return {
      matriculaImovel: croquiEndereco.matriculaImovel,
      dv: croquiEndereco.dv,
      nomeClienteInterno: croquiEndereco.nomeClienteInterno,
      siglaLogradouro: croquiEndereco.siglaLogradouro,
      logradouro: croquiEndereco.logradouro,
      numeroEndereco: croquiEndereco.numeroEndereco,
      bairro: croquiEndereco.bairro,
      cidade: croquiEndereco.cidade,
      enderecoCompleto: croquiEndereco.enderecoCompleto,
    };
  }
}
