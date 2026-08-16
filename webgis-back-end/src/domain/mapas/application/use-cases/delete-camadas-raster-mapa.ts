import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasRepository } from '../repositories/mapas-repository';

interface DeleteCamadaRasterMaparUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
  COD_MAPA_ID: string;
}

@Injectable()
export class DeleteCamadaRasterMapaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    COD_MAPA_ID,
  }: DeleteCamadaRasterMaparUseCaseRequest) {
    {
      try {
        await this.mapasRepository.removeCamadaRasterFromMapa(
          COD_MAPA_ID,
          COD_CAMADA_RASTER_ID,
        );
        return right(null);
      } catch (error) {
        return left(
          'Failed to delete the camada from Mapa. Please make sure the ID is correct.',
        );
      }
    }
  }
}
