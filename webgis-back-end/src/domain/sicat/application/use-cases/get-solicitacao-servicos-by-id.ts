import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { SolicitacaoServicosRepository } from '../repositories/solicitacao-servicos-repository';
import { SolicitacaoServicos } from '../../enterprise/entities/solicitacao-servicos';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

interface GetSolicitacaoServicosByIdUseCaseRequest {
  numSs: string;
  seqSs: number;
}

type GetSolicitacaoServicosByIdUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    solicitacao: SolicitacaoServicos;
  }
>;

@Injectable()
export class GetSolicitacaoServicosByIdUseCase {
  constructor(
    private solicitacaoServicosRepository: SolicitacaoServicosRepository,
  ) {}

  async execute({
    numSs,
    seqSs,
  }: GetSolicitacaoServicosByIdUseCaseRequest): Promise<GetSolicitacaoServicosByIdUseCaseResponse> {
    const solicitacao = await this.solicitacaoServicosRepository.findById(
      numSs,
      seqSs,
    );

    if (!solicitacao) {
      return left(new ResourceNotFoundError());
    }

    return right({
      solicitacao,
    });
  }
}
