import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasCamadas } from '../../../mapas/enterprise/entities/mapas-camadas';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';

interface GetMapaCamadaUseCaseRequest {
  COD_MAPA_ID: string;
  COD_CAMADA_ID: string;
}

type GetMapaCamadaUseCaseResponse = Either<
  null,
  {
    mapasCamadas: MapasCamadas;
  }
>;

@Injectable()
export class GetMapaCamadaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_CAMADA_ID,
  }: GetMapaCamadaUseCaseRequest): Promise<GetMapaCamadaUseCaseResponse> {
    const mapasCamadas = await this.mapasRepository.findCamadaMapaById(
      COD_MAPA_ID,
      COD_CAMADA_ID,
    );

    if (!mapasCamadas) {
      return left(null);
    }

    return right({
      mapasCamadas,
    });
  }
}
