import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { CamadasRaster } from '../../enterprise/entities/camadas-raster';

interface ActivateCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
}

type ActivateCamadaRasterUseCaseResponse = Either<
  null,
  {
    camadaRaster: CamadasRaster;
  }
>;

@Injectable()
export class ActivateCamadaRasterUseCase {
  constructor(private camadaRasterRepository: CamadasRasterRepository) {}

  async execute({
    COD_CAMADA_RASTER_ID,
  }: ActivateCamadaRasterUseCaseRequest): Promise<ActivateCamadaRasterUseCaseResponse> {
    const camadaRaster =
      await this.camadaRasterRepository.findById(COD_CAMADA_RASTER_ID);

    if (!camadaRaster) {
      return left(null);
    }

    await this.camadaRasterRepository.activateCamada(COD_CAMADA_RASTER_ID);

    return right({
      camadaRaster: camadaRaster,
    });
  }
}
