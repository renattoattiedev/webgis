import { Either, left, right } from '@/core/either';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { Injectable } from '@nestjs/common';

interface FetchCamadasRasterUseCaseRequest {
  NOM_NOME: string;
}
interface FetchCamadaRasterNomeUseCaseRequest {
  NOM_NOME: string;
}
type FetchCamadaRasterUseCaseResponse = Either<
  null,
  {
    camadasRaster: CamadasRaster;
  }
>;
type FetchCamadasRasterUseCaseResponse = Either<
  null,
  {
    camadasRaster: CamadasRaster[];
  }
>;

@Injectable()
export class FetchCamadasRasterUseCase {
  constructor(private camadasRasterRepository: CamadasRasterRepository) {}

  async executeMany({
    NOM_NOME,
  }: FetchCamadasRasterUseCaseRequest): Promise<FetchCamadasRasterUseCaseResponse> {
    const camadasRaster =
      await this.camadasRasterRepository.findManyByCamadasId(NOM_NOME);

    return right({
      camadasRaster,
    });
  }

  async execute({
    NOM_NOME,
  }: FetchCamadaRasterNomeUseCaseRequest): Promise<FetchCamadaRasterUseCaseResponse> {
    const camadasRaster =
      await this.camadasRasterRepository.findByNome(NOM_NOME);

    if (!camadasRaster) {
      return left(null);
    }

    return right({
      camadasRaster,
    });
  }
}
