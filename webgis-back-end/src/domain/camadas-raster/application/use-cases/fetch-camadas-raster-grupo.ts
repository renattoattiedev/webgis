import { Either, right } from '@/core/either';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { Injectable } from '@nestjs/common';

interface FetchCamadasRasterGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
}

type FetchCamadasRasterGrupoUseCaseResponse = Either<
  null,
  {
    camadasRaster: CamadasRaster[];
  }
>;

@Injectable()
export class FetchCamadasRasterGrupoUseCase {
  constructor(private camadasRasterRepository: CamadasRasterRepository) {}

  async execute({
    COD_GRUPO_ID,
  }: FetchCamadasRasterGrupoUseCaseRequest): Promise<FetchCamadasRasterGrupoUseCaseResponse> {
    const camadasRaster =
      await this.camadasRasterRepository.findManyByCamadasGrupoId(COD_GRUPO_ID);

    return right({
      camadasRaster,
    });
  }
}
