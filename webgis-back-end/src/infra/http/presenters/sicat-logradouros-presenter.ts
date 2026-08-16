import { SicatLogradouro } from '@/domain/sicat/enterprise/entities/sicat-logradouro';

export class SicatLogradourosPresenter {
  static toHTTP(sicatLogradouro: SicatLogradouro) {
    return {
      codigoLogradouro: sicatLogradouro.codigoLogradouro,
      sigla: sicatLogradouro.siglaLogradouro,
      logradouro: sicatLogradouro.nomeLogradouro,
      logradouroCompleto: sicatLogradouro.logradouroCompleto,
    };
  }
}
