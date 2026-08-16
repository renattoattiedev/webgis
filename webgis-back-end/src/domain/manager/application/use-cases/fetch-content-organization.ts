import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { ContentRepository } from '../repositories/content-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

type FetchContentOrganizationUseCaseResponse = Either<
  null,
  {
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }
>;

@Injectable()
export class FetchContentOrganizationUseCase {
  constructor(private contentRepository: ContentRepository) {}

  async executeMany(): Promise<FetchContentOrganizationUseCaseResponse> {
    const { camadas, camadasRaster, mapas } =
      await this.contentRepository.findManyContentOrganization();

    return right({
      camadas,
      camadasRaster,
      mapas,
    });
  }
}
