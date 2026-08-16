import { Either, right } from '@/core/either';
import { SicatRepository } from '../repositories/sicat-repository';
import { Injectable } from '@nestjs/common';
import { SicatCidade } from '../../enterprise/entities/sicat-cidades';

interface FetchSicatCidadesUseCaseRequest {}

type FetchSicatCidadesUseCaseResponse = Either<
  null,
  {
    cidades: SicatCidade[];
  }
>;

@Injectable()
export class FetchSicatCidadesUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({}: FetchSicatCidadesUseCaseRequest): Promise<FetchSicatCidadesUseCaseResponse> {
    const cidades = await this.sicatRepository.findManyCidades();

    return right({
      cidades,
    });
  }
}
