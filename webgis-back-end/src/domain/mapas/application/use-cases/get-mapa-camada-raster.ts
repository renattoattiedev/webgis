import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasCamadasRaster } from '../../enterprise/entities/mapas-camadas-raster';
import { MapasRepository } from '../repositories/mapas-repository';

interface GetMapaCamadaRasterUseCaseRequest {
  COD_MAPA_ID: string;
  COD_CAMADA_RASTER_ID: string;
}

type GetMapaCamadaRasterUseCaseResponse = Either<
  null,
  {
    mapasCamadasRaster: MapasCamadasRaster;
  }
>;

@Injectable()
export class GetMapaCamadaRasterUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_CAMADA_RASTER_ID,
  }: GetMapaCamadaRasterUseCaseRequest): Promise<GetMapaCamadaRasterUseCaseResponse> {
    const mapasCamadasRaster =
      await this.mapasRepository.findCamadaRasterMapaById(
        COD_MAPA_ID,
        COD_CAMADA_RASTER_ID,
      );

    if (!mapasCamadasRaster) {
      return left(null);
    }

    return right({
      mapasCamadasRaster,
    });
  }
}
