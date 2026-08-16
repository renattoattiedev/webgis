import { right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { MapasCamadasFiltros } from '../../../mapas/enterprise/entities/mapas-camadas-filtro';

interface AssociateMapaCamadaToFiltroUseCaseRequest {
  COD_FILTRO_ID: UniqueEntityID;
  COD_MAPA_CAMADA_ID: string;
  DSC_FILTRO: string;
}

@Injectable()
export class AssociateMapaCamadaFiltroUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_CAMADA_ID,
    DSC_FILTRO,
  }: AssociateMapaCamadaToFiltroUseCaseRequest) {
    const mapasCamadasFiltros = MapasCamadasFiltros.create({
      COD_MAPA_CAMADA_ID,
      DSC_FILTRO,
    });

    await this.mapasRepository.addFiltrosToMapa(mapasCamadasFiltros);

    return right({
      mapasCamadasFiltros,
    });
  }
}
