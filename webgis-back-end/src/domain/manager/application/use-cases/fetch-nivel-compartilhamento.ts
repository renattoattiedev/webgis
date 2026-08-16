import { Either, left, right } from '@/core/either';
import { NivelCompartilhamentoRepository } from '../repositories/nivel-compartilhamento-repository';
import { NivelCompartilhamento } from '@/domain/manager/enterprise/entities/nivel-compartilhamento';
import { Injectable } from '@nestjs/common';

interface FetchNivelCompartilhamentoUseCaseRequest {
  COD_NIVEL_COMPATILHAMENTO: string;
}

type FetchNivelCompartilhamentoUseCaseResponse = Either<
  null,
  {
    nivelCompartilhamento: NivelCompartilhamento;
  }
>;

type FetchNivelCompartilhamentoUseCaseManyResponse = Either<
  null,
  {
    nivelCompartilhamentoMany: NivelCompartilhamento[];
  }
>;

@Injectable()
export class FetchNivelCompartilhamentoUseCase {
  constructor(
    private nivelCompartilhamentoRepository: NivelCompartilhamentoRepository,
  ) {}

  async execute({
    COD_NIVEL_COMPATILHAMENTO,
  }: FetchNivelCompartilhamentoUseCaseRequest): Promise<FetchNivelCompartilhamentoUseCaseResponse> {
    const nivelCompartilhamento =
      await this.nivelCompartilhamentoRepository.findById(
        COD_NIVEL_COMPATILHAMENTO,
      );

    if (!nivelCompartilhamento) {
      return left(null);
    }

    return right({
      nivelCompartilhamento,
    });
  }

  async executeMany({
    COD_NIVEL_COMPATILHAMENTO,
  }: FetchNivelCompartilhamentoUseCaseRequest): Promise<FetchNivelCompartilhamentoUseCaseManyResponse> {
    const nivelCompartilhamentoMany =
      await this.nivelCompartilhamentoRepository.findManyByNivelCompartilhamentoId(
        COD_NIVEL_COMPATILHAMENTO,
      );

    return right({
      nivelCompartilhamentoMany,
    });
  }
}
