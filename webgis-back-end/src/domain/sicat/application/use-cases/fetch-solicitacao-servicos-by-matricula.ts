import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { SolicitacaoServicosRepository } from '../repositories/solicitacao-servicos-repository';
import { SolicitacaoServicos } from '../../enterprise/entities/solicitacao-servicos';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

interface FetchSolicitacaoServicosByMatriculaUseCaseRequest {
  matricula: string;
}

type FetchSolicitacaoServicosByMatriculaUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    solicitacoes: SolicitacaoServicos[];
  }
>;

@Injectable()
export class FetchSolicitacaoServicosByMatriculaUseCase {
  constructor(
    private solicitacaoServicosRepository: SolicitacaoServicosRepository,
  ) {}

  async execute({
    matricula,
  }: FetchSolicitacaoServicosByMatriculaUseCaseRequest): Promise<FetchSolicitacaoServicosByMatriculaUseCaseResponse> {
    const solicitacoes =
      await this.solicitacaoServicosRepository.findByMatriculaImovel(matricula);

    if (solicitacoes.length === 0) {
      return left(new ResourceNotFoundError());
    }

    return right({
      solicitacoes,
    });
  }
}
