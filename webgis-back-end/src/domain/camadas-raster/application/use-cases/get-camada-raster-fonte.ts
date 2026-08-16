import { Either, left, right } from '@/core/either';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { Injectable } from '@nestjs/common';

interface GetCamadaRasterFonteUseCaseRequest {
  NOM_NOME: string;
  DSC_FONTE_DADOS_CAMADA: string;
}
type FetchCamadaRasterFonteUseCaseResponse = Either<
  null,
  {
    camadasRaster: CamadasRaster;
  }
>;

@Injectable()
export class GetCamadasRasterFonteUseCase {
  constructor(private camadasRasterRepository: CamadasRasterRepository) {}

  async execute({
    NOM_NOME,
    DSC_FONTE_DADOS_CAMADA,
  }: GetCamadaRasterFonteUseCaseRequest): Promise<FetchCamadaRasterFonteUseCaseResponse> {
    const camadasRaster = await this.camadasRasterRepository.findByNomeFonte(
      NOM_NOME,
      DSC_FONTE_DADOS_CAMADA,
    );

    if (!camadasRaster) {
      return left(null);
    }

    return right({
      camadasRaster,
    });
  }
}
