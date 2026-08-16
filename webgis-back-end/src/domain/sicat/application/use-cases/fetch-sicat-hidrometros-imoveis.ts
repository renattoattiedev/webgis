import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { SicatRepository } from '../repositories/sicat-repository';
import { SicatHidrometroImovel } from '../../enterprise/entities/sicat-hidrometro-imovel';

type FetchSicatHidrometrosImoveisUseCaseResponse = Either<
  null,
  {
    hidrometros: SicatHidrometroImovel[];
  }
>;

@Injectable()
export class FetchSicatHidrometrosImoveisUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute(): Promise<FetchSicatHidrometrosImoveisUseCaseResponse> {
    const hidrometros = await this.sicatRepository.findManyHidrometrosImoveis();

    return right({
      hidrometros,
    });
  }
}
