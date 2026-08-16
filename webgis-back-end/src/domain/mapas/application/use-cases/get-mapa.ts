import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';

interface GetMapaUseCaseRequest {
  COD_MAPA_ID: string;
}

type GetMapaUseCaseResponse = Either<
  null,
  {
    mapa: Mapas;
    camadas: Camadas[];
  }
>;

@Injectable()
export class GetMapaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
  }: GetMapaUseCaseRequest): Promise<GetMapaUseCaseResponse> {
    const { mapa, camadas } = await this.mapasRepository.findById(COD_MAPA_ID);

    if (!mapa) {
      return left(null);
    }

    return right({
      mapa,
      camadas,
    });
  }
}
