import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { SicatRepository } from '../repositories/sicat-repository';
import { SicatImovel } from '../../enterprise/entities/sicat-imovel';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { SicatImovelMatriculaDetalhada } from '../../enterprise/entities/sicat-imovel-matricula-detalhada';

interface FetchSicatImovelByMatriculaUseCaseRequest {
  matricula_imovel: number;
}

type FetchSicatImovelByMatriculaUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    imovel: SicatImovelMatriculaDetalhada;
  }
>;

@Injectable()
export class FetchSicatImovelByMatriculaUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({
    matricula_imovel,
  }: FetchSicatImovelByMatriculaUseCaseRequest): Promise<FetchSicatImovelByMatriculaUseCaseResponse> {
    const imovel =
      await this.sicatRepository.findImovelByMatricula(matricula_imovel);

    if (!imovel) {
      return left(new ResourceNotFoundError());
    }

    return right({
      imovel,
    });
  }
}
