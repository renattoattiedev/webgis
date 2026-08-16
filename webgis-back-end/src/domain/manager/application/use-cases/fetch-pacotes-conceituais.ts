import { Either, left, right } from '@/core/either';
import { PacotesConceituaisRepository } from '../repositories/pacotes-conceituais-repository';
import { PacotesConceituais } from '@/domain/manager/enterprise/entities/pacotes-conceituais';
import { Injectable } from '@nestjs/common';

interface FetchPacotesConceituaisUseCaseRequest {
  COD_PACOTE_CONCEITUAL_ID: string;
}

type FetchPacotesConceituaisUseCaseResponse = Either<
  null,
  {
    pacotesConceituais: PacotesConceituais;
  }
>;
type FetchPacotesConceituaisManyUseCaseResponse = Either<
  null,
  {
    pacotesConceituaisMany: PacotesConceituais[];
  }
>;

@Injectable()
export class FetchPacotesConceituaisUseCase {
  constructor(
    private pacotesConceituaisRepository: PacotesConceituaisRepository,
  ) {}

  async execute({
    COD_PACOTE_CONCEITUAL_ID,
  }: FetchPacotesConceituaisUseCaseRequest): Promise<FetchPacotesConceituaisUseCaseResponse> {
    const pacotesConceituais = await this.pacotesConceituaisRepository.findById(
      COD_PACOTE_CONCEITUAL_ID,
    );

    if (!pacotesConceituais) {
      return left(null);
    }

    return right({
      pacotesConceituais,
    });
  }

  async executeMany({
    COD_PACOTE_CONCEITUAL_ID,
  }: FetchPacotesConceituaisUseCaseRequest): Promise<FetchPacotesConceituaisManyUseCaseResponse> {
    const pacotesConceituaisMany =
      await this.pacotesConceituaisRepository.findManyByPacotesConceituaisId(
        COD_PACOTE_CONCEITUAL_ID,
      );

    return right({
      pacotesConceituaisMany,
    });
  }
}
