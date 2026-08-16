import { Either, right } from '@/core/either';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { Injectable } from '@nestjs/common';

interface FetchMapasUserUseCaseRequest {
  COD_USUARIO_CRIACAO: string;
}

type FetchMapasUserUseCaseResponse = Either<
  null,
  {
    mapas: Mapas[];
  }
>;

@Injectable()
export class FetchMapasUserUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_USUARIO_CRIACAO,
  }: FetchMapasUserUseCaseRequest): Promise<FetchMapasUserUseCaseResponse> {
    const mapas =
      await this.mapasRepository.findManyByMapasUserId(COD_USUARIO_CRIACAO);

    return right({
      mapas,
    });
  }
}
