import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { SicatRepository } from '../repositories/sicat-repository';
import { SicatImovelHidrometroDetalhado } from '../../enterprise/entities/sicat-imovel-hidrometro-detalhado';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

interface FetchSicatImovelByCodigoHidrometroUseCaseRequest {
  codigo_hidrometro: string;
}

type FetchSicatImovelByCodigoHidrometroUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    imovelDetalhado: SicatImovelHidrometroDetalhado;
  }
>;

@Injectable()
export class FetchSicatImovelByCodigoHidrometroUseCase {
  constructor(private sicatRepository: SicatRepository) {}

  async execute({
    codigo_hidrometro,
  }: FetchSicatImovelByCodigoHidrometroUseCaseRequest): Promise<FetchSicatImovelByCodigoHidrometroUseCaseResponse> {
    const imovelDetalhado =
      await this.sicatRepository.findImovelDetalhadoByCodigoHidrometro(
        codigo_hidrometro,
      );

    if (!imovelDetalhado) {
      return left(new ResourceNotFoundError());
    }

    return right({
      imovelDetalhado,
    });
  }
}
