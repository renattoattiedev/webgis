import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';

interface DeleteCamadaMaparUseCaseRequest {
  COD_CAMADA_ID: string;
  COD_MAPA_ID: string;
}

@Injectable()
export class DeleteCamadaMapaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_CAMADA_ID,
    COD_MAPA_ID,
  }: DeleteCamadaMaparUseCaseRequest) {
    {
      try {
        await this.mapasRepository.removeCamadaFromMapa(
          COD_MAPA_ID,
          COD_CAMADA_ID,
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
