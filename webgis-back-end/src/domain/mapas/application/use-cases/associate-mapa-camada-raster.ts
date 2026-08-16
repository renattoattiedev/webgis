import { right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapasRepository } from '../repositories/mapas-repository';
import { MapasCamadasRaster } from '../../enterprise/entities/mapas-camadas-raster';

interface AssociateMapaToCamadaRasterUseCaseRequest {
  COD_MAPA_CAMADA_RASTER_ID: UniqueEntityID;
  COD_MAPA_ID: string;
  COD_CAMADA_RASTER_ID: string;
  NUM_ORDEM_RENDERIZACAO: number;
}

@Injectable()
export class AssociateMapaCamadaRasterUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_CAMADA_RASTER_ID,
    NUM_ORDEM_RENDERIZACAO,
  }: AssociateMapaToCamadaRasterUseCaseRequest) {
    const mapasCamadasRaster = MapasCamadasRaster.create({
      COD_MAPA_ID,
      COD_CAMADA_RASTER_ID,
      NUM_ORDEM_RENDERIZACAO,
    });

    await this.mapasRepository.addCamadaRasterToMapa(mapasCamadasRaster);

    return right({
      mapasCamadasRaster,
    });
  }
}
