import { right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { MapasCamadas } from '../../../mapas/enterprise/entities/mapas-camadas';

interface AssociateMapaToCamadaUseCaseRequest {
  COD_MAPA_CAMADA_ID: UniqueEntityID;
  COD_MAPA_ID: string;
  COD_CAMADA_ID: string;
  NUM_ORDEM_RENDERIZACAO: number;
}

@Injectable()
export class AssociateMapaCamadaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_CAMADA_ID,
    NUM_ORDEM_RENDERIZACAO,
  }: AssociateMapaToCamadaUseCaseRequest) {
    const mapasCamadas = MapasCamadas.create({
      COD_MAPA_ID,
      COD_CAMADA_ID,
      NUM_ORDEM_RENDERIZACAO,
    });

    await this.mapasRepository.addCamadaToMapa(mapasCamadas);

    return right({
      mapasCamadas,
    });
  }
}
