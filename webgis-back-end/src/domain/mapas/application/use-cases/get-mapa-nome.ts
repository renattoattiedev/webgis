import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

interface GetMapaNomeUseCaseRequest {
  NOM_NOME_MAPA: string;
}

type GetMapaNomeUseCaseResponse = Either<
  null,
  {
    mapa: Mapas;
    camadasRaster: CamadasRaster[];
    camadas: Camadas[];
  }
>;

@Injectable()
export class GetMapaNomeUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    NOM_NOME_MAPA,
  }: GetMapaNomeUseCaseRequest): Promise<GetMapaNomeUseCaseResponse> {
    const { mapa, camadasRaster, camadas } =
      await this.mapasRepository.findByNome(NOM_NOME_MAPA);

    if (!mapa) {
      return left(null);
    }

    const camadasRasterTransformed = camadasRaster.map(
      (item) => item.camadaRaster,
    );
    const camadasTransformed = camadas.map((item) => item.camada);

    return right({
      mapa,
      camadasRaster: camadasRasterTransformed,
      camadas: camadasTransformed,
    });
  }
}
