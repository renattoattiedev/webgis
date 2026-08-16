import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { SolicitacaoServicosRepository } from '../repositories/solicitacao-servicos-repository';
import { SolicitacaoServicos } from '../../enterprise/entities/solicitacao-servicos';

type FetchSolicitacaoServicosUseCaseResponse = Either<
  null,
  {
    solicitacoes: SolicitacaoServicos[];
  }
>;

@Injectable()
export class FetchSolicitacaoServicosUseCase {
  constructor(
    private solicitacaoServicosRepository: SolicitacaoServicosRepository,
  ) {}

  async execute(): Promise<FetchSolicitacaoServicosUseCaseResponse> {
    const solicitacoes = await this.solicitacaoServicosRepository.findMany();

    return right({
      solicitacoes,
    });
  }
}
