import { Either, right } from '@/core/either';
import { SicatRepository } from '../repositories/sicat-repository';
import { Injectable } from '@nestjs/common';
import { SicatImovel } from '../../enterprise/entities/sicat-imovel';

interface FetchSicatImoveisUseCaseRequest {}

type FetchSicatImoveisUseCaseResponse = Either<
  null,
  {
    imoveis: SicatImovel[];
  }
>;

@Injectable()
export class FetchSicatImoveisUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({}: FetchSicatImoveisUseCaseRequest): Promise<FetchSicatImoveisUseCaseResponse> {
    const imoveis = await this.sicatRepository.findManyImoveis();

    return right({
      imoveis,
    });
  }
}
