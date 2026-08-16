import { Either, left, right } from '@/core/either';
import { PacotesConceituaisRepository } from '../repositories/pacotes-conceituais-repository';
import { PacotesConceituais } from '@/domain/manager/enterprise/entities/pacotes-conceituais';
import { Injectable } from '@nestjs/common';

interface FetchPacotesConceituaisUseCaseRequest {
  NOM_NOME_PACOTE_CONCEITUAL: string;
}

type FetchPacotesConceituaisUseCaseResponse = Either<
  null,
  {
    pacotesConceituais: PacotesConceituais;
  }
>;

@Injectable()
export class FetchPacotesConceituaisByNomeUseCase {
  constructor(
    private pacotesConceituaisRepository: PacotesConceituaisRepository,
  ) {}

  async execute({
    NOM_NOME_PACOTE_CONCEITUAL,
  }: FetchPacotesConceituaisUseCaseRequest): Promise<FetchPacotesConceituaisUseCaseResponse> {
    const pacotesConceituais =
      await this.pacotesConceituaisRepository.findByNome(
        NOM_NOME_PACOTE_CONCEITUAL,
      );

    if (!pacotesConceituais) {
      return left(null);
    }

    return right({
      pacotesConceituais,
    });
  }
}
