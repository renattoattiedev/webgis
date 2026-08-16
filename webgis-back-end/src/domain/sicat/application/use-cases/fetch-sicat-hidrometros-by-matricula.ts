import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { SicatRepository } from '../repositories/sicat-repository';
import { SicatHidrometroImovel } from '../../enterprise/entities/sicat-hidrometro-imovel';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

interface FetchSicatHidrometrosByMatriculaUseCaseRequest {
  matricula_imovel: number;
}

type FetchSicatHidrometrosByMatriculaUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    hidrometros: SicatHidrometroImovel[];
  }
>;

@Injectable()
export class FetchSicatHidrometrosByMatriculaUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({
    matricula_imovel,
  }: FetchSicatHidrometrosByMatriculaUseCaseRequest): Promise<FetchSicatHidrometrosByMatriculaUseCaseResponse> {
    const hidrometros =
      await this.sicatRepository.findHidrometrosByMatricula(matricula_imovel);

    if (hidrometros.length === 0) {
      return left(new ResourceNotFoundError());
    }

    return right({
      hidrometros,
    });
  }
}
