import { Either, right } from '@/core/either';
import { SicatRepository } from '../repositories/sicat-repository';
import { Injectable } from '@nestjs/common';
import { SicatBairro } from '../../enterprise/entities/sicat-bairro';

interface FetchSicatBairrosUseCaseRequest {
  cd_cidades: number[];
}

type FetchSicatBairrosCaseResponse = Either<
  null,
  {
    bairros: SicatBairro[];
  }
>;

@Injectable()
export class FetchSicatBairrosUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({
    cd_cidades,
  }: FetchSicatBairrosUseCaseRequest): Promise<FetchSicatBairrosCaseResponse> {
    const bairros = await this.sicatRepository.findManyBairros(cd_cidades);

    return right({
      bairros,
    });
  }
}
