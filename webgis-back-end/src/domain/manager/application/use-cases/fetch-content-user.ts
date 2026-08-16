import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { ContentRepository } from '../repositories/content-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

interface FetchContentUserUseCaseRequest {
  COD_USUARIO_CRIACAO: string;
}
type FetchContentUserUseCaseResponse = Either<
  null,
  {
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }
>;

@Injectable()
export class FetchContentUserUseCase {
  constructor(private contentRepository: ContentRepository) {}

  async executeMany({
    COD_USUARIO_CRIACAO,
  }: FetchContentUserUseCaseRequest): Promise<FetchContentUserUseCaseResponse> {
    const { camadas, camadasRaster, mapas } =
      await this.contentRepository.findManyContentUserId(COD_USUARIO_CRIACAO);

    return right({
      camadas,
      camadasRaster,
      mapas,
    });
  }
}
