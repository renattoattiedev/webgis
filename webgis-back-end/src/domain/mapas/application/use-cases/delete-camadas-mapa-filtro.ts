import { left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';

interface DeleteFiltroCamadaMaparUseCaseRequest {
  COD_FILTRO_ID: string;
}

@Injectable()
export class DeleteFiltroCamadaMapaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({ COD_FILTRO_ID }: DeleteFiltroCamadaMaparUseCaseRequest) {
    {
      try {
        const mapasCamadas =
          await this.mapasRepository.findCamadaMapaFiltrosById(COD_FILTRO_ID);
        if (!mapasCamadas) {
          return left('Filtro not found in Camada from Mapa');
        }

        await this.mapasRepository.removeFiltrosFromMapa(COD_FILTRO_ID);
        return right(null);
      } catch (error) {
        return left(
          'Failed to delete the filtro from camada/Mapa. Please make sure the ID is correct.',
        );
      }
    }
  }
}
