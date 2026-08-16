import { Either, right } from '@/core/either';
import { SicatRepository } from '../repositories/sicat-repository';
import { Injectable } from '@nestjs/common';
import { SicatLogradouro } from '../../enterprise/entities/sicat-logradouro';

interface FetchSicatLogradouroUseCaseRequest {
  cd_cidades: number[];
}

type FetchSicatLogradouroUseCaseResponse = Either<
  null,
  {
    logradouros: SicatLogradouro[];
  }
>;

@Injectable()
export class FetchSicatLogradourosUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({
    cd_cidades,
  }: FetchSicatLogradouroUseCaseRequest): Promise<FetchSicatLogradouroUseCaseResponse> {
    const logradouros =
      await this.sicatRepository.findManyLogradouros(cd_cidades);

    return right({
      logradouros,
    });
  }
}
