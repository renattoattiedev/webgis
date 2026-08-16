import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasCamadasFiltros } from '../../../mapas/enterprise/entities/mapas-camadas-filtro';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';

interface GetMapaCamadaFiltroUseCaseRequest {
  COD_FILTRO_ID: string;
}

type GetMapaCamadaFiltroUseCaseResponse = Either<
  null,
  {
    mapasCamadasFiltros: MapasCamadasFiltros;
  }
>;

@Injectable()
export class GetMapaCamadaFiltroUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_FILTRO_ID,
  }: GetMapaCamadaFiltroUseCaseRequest): Promise<GetMapaCamadaFiltroUseCaseResponse> {
    const mapasCamadasFiltros =
      await this.mapasRepository.findCamadaMapaFiltrosById(COD_FILTRO_ID);

    if (!mapasCamadasFiltros) {
      return left(null);
    }

    return right({
      mapasCamadasFiltros,
    });
  }
}
