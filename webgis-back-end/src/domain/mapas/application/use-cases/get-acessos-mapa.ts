import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasLogRepository } from '../repositories/mapas-logs-repository';

interface GetAcessosMapaUseCaseRequest {
  COD_MAPA_ID: string;
}

type GetAcessosMapaUseCaseResponse = Either<
  null,
  {
    acessos: number;
  }
>;

@Injectable()
export class GetAcessosMapaUseCase {
  constructor(private mapasLogRepository: MapasLogRepository) {}

  async execute({
    COD_MAPA_ID,
  }: GetAcessosMapaUseCaseRequest): Promise<GetAcessosMapaUseCaseResponse> {
    const acessos =
      await this.mapasLogRepository.getAcessosByMapasId(COD_MAPA_ID);

    return right({
      acessos,
    });
  }
}
