import { Either, right } from '@/core/either';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { Injectable } from '@nestjs/common';

interface FetchMapasGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
}

type FetchMapasGrupoUseCaseResponse = Either<
  null,
  {
    mapas: Mapas[];
  }
>;

@Injectable()
export class FetchMapasGrupoUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_GRUPO_ID,
  }: FetchMapasGrupoUseCaseRequest): Promise<FetchMapasGrupoUseCaseResponse> {
    const mapas =
      await this.mapasRepository.findManyByMapasGrupoId(COD_GRUPO_ID);

    return right({
      mapas,
    });
  }
}
