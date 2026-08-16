import { Injectable } from '@nestjs/common';
import { SolicitacaoServicosRepository } from '../repositories/solicitacao-servicos-repository';

interface FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCaseRequest {
  numSs: string;
  seqSs: number;
}

interface FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCaseResponse {
  solicitacoes: any[];
}

@Injectable()
export class FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCase {
  constructor(
    private solicitacaoServicosRepository: SolicitacaoServicosRepository,
  ) {}

  async execute({
    numSs,
    seqSs,
  }: FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCaseRequest): Promise<FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCaseResponse> {
    const solicitacoes =
      await this.solicitacaoServicosRepository.findDetalhadaByRefAtendimento(
        numSs,
        seqSs,
      );

    return {
      solicitacoes,
    };
  }
}
