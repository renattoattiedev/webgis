import { Injectable } from '@nestjs/common';
import { SolicitacaoServicosRepository } from '../repositories/solicitacao-servicos-repository';

interface FetchSolicitacaoServicosByNumSsUseCaseRequest {
  numSs: string;
}

interface FetchSolicitacaoServicosByNumSsUseCaseResponse {
  seqSs: number[];
}

@Injectable()
export class FetchSolicitacaoServicosByNumSsUseCase {
  constructor(
    private solicitacaoServicosRepository: SolicitacaoServicosRepository,
  ) {}

  async execute({
    numSs,
  }: FetchSolicitacaoServicosByNumSsUseCaseRequest): Promise<FetchSolicitacaoServicosByNumSsUseCaseResponse> {
    const seqSs =
      await this.solicitacaoServicosRepository.findSeqSsByNumSs(numSs);

    return {
      seqSs,
    };
  }
}
