// src/domain/sicat/application/use-cases/Get-sicat-imovel-by-matricula.ts
import { Either, right, left } from '@/core/either';
import { SicatRepository } from '../repositories/sicat-repository';
import { Injectable } from '@nestjs/common';
import { SicatImovelMatriculaDetalhada } from '../../enterprise/entities/sicat-imovel-matricula-detalhada';

interface GetSicatImovelByMatriculaUseCaseRequest {
  matricula_imovel: number;
}

type GetSicatImovelByMatriculaUseCaseResponse = Either<
  null,
  {
    imovel: SicatImovelMatriculaDetalhada;
  }
>;

@Injectable()
export class GetSicatImovelByMatriculaUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({
    matricula_imovel,
  }: GetSicatImovelByMatriculaUseCaseRequest): Promise<GetSicatImovelByMatriculaUseCaseResponse> {
    const imovel =
      await this.sicatRepository.findImovelByMatricula(matricula_imovel);

    if (!imovel) {
      return left(null);
    }

    return right({
      imovel,
    });
  }
}
