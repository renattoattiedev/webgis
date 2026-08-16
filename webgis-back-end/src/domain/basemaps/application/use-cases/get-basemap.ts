import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Basemap } from '../../enterprise/entities/basemap';
import { BasemapsRepository } from '../repositories/basemaps-repository';

interface GetBasemapUseCaseRequest {
  COD_BASEMAP_ID: string;
}

type GetBasemapUseCaseResponse = Either<
  null,
  {
    basemap: Basemap;
  }
>;

@Injectable()
export class GetBasemapUseCase {
  constructor(private basemapsRepository: BasemapsRepository) {}

  async execute({
    COD_BASEMAP_ID,
  }: GetBasemapUseCaseRequest): Promise<GetBasemapUseCaseResponse> {
    const basemap = await this.basemapsRepository.findById(COD_BASEMAP_ID);

    if (!basemap) {
      return left(null);
    }

    return right({
      basemap,
    });
  }
}
