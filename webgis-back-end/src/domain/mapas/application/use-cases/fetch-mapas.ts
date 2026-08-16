import { Either, right } from '@/core/either';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { Injectable } from '@nestjs/common';

type FetchMapasUseCaseResponse = Either<
  null,
  {
    mapas: Mapas[];
  }
>;

@Injectable()
export class FetchMapasUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute(): Promise<FetchMapasUseCaseResponse> {
    const mapas = await this.mapasRepository.findManyByMapas();

    return right({
      mapas,
    });
  }
}
