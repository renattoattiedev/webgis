import { CroquiEndereco } from '../../enterprise/entities/croqui-endereco';

export abstract class CroquiRepository {
  abstract findCroquiEnderecoCompleto(): Promise<CroquiEndereco[]>;
  abstract findCroquiEnderecoCompletoByMatricula(
    matricula: number,
  ): Promise<CroquiEndereco | null>;
  abstract findCroquiEnderecoCompletoByCliente(
    nomeCliente: string,
  ): Promise<CroquiEndereco | null>;
  abstract findCroquiEnderecoCompletoByCidade(
    cidade: string,
  ): Promise<CroquiEndereco[]>;
  abstract findCroquiEnderecoCompletoByBairro(
    bairro: string,
  ): Promise<CroquiEndereco[]>;
  abstract findCroquiEnderecoCompletoByLogradouro(
    logradouro: string,
  ): Promise<CroquiEndereco[]>;
  abstract findCroquiEnderecoCompletoByFiltros(
    cd_cidade?: number,
    cd_bairro?: number,
    cd_logradouro?: number,
  ): Promise<CroquiEndereco[]>;
}
