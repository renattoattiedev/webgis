import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { CamadasRaster } from '../../enterprise/entities/camadas-raster';

interface DeactivateCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
}

type DeactivateCamadaRasterUseCaseResponse = Either<
  null,
  {
    camadaRaster: CamadasRaster;
  }
>;

@Injectable()
export class DeactivateCamadaRasterUseCase {
  constructor(private camadasRasterRepository: CamadasRasterRepository) {}

  async execute({
    COD_CAMADA_RASTER_ID,
  }: DeactivateCamadaRasterUseCaseRequest): Promise<DeactivateCamadaRasterUseCaseResponse> {
    const camadaRaster =
      await this.camadasRasterRepository.findById(COD_CAMADA_RASTER_ID);

    if (!camadaRaster) {
      return left(null);
    }

    await this.camadasRasterRepository.deactivateCamada(COD_CAMADA_RASTER_ID);

    return right({
      camadaRaster,
    });
  }
}
