import { Either, right } from '@/core/either';
import { BasemapsRepository } from '../repositories/basemaps-repository';
import { Basemap } from '../../enterprise/entities/basemap';
import { Injectable } from '@nestjs/common';

interface FetchBasemapsUseCaseRequest {
  COD_BASEMAP_ID?: string;
}

type FetchBasemapsUseCaseResponse = Either<
  null,
  {
    basemaps: Basemap[];
  }
>;

@Injectable()
export class FetchBasemapsUseCase {
  constructor(private basemapsRepository: BasemapsRepository) {}

  async execute({
    COD_BASEMAP_ID,
  }: FetchBasemapsUseCaseRequest): Promise<FetchBasemapsUseCaseResponse> {
    const basemaps =
      await this.basemapsRepository.findManyByBasemapId(COD_BASEMAP_ID);

    return right({
      basemaps,
    });
  }
}
