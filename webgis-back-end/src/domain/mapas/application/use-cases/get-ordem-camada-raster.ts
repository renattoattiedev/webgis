import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';

interface GetOrdemCamadaRasterUseCaseRequest {
  COD_MAPA_ID: string;
  COD_CAMADA_RASTER_ID: string;
}

type GetOrdemCamadaRasterUseCaseResponse = Either<
  null,
  {
    ordem: number;
  }
>;

@Injectable()
export class GetOrdemCamadaRasterUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_CAMADA_RASTER_ID,
  }: GetOrdemCamadaRasterUseCaseRequest): Promise<GetOrdemCamadaRasterUseCaseResponse> {
    const ordem = await this.mapasRepository.getOrdemCamadaRaster(
      COD_MAPA_ID,
      COD_CAMADA_RASTER_ID,
    );

    if (!ordem) {
      return left(null);
    }

    return right({
      ordem,
    });
  }
}
