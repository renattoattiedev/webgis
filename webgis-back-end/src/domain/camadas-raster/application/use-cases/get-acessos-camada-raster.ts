import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRasterLogRepository } from '../repositories/camadas-raster-logs-repository';

interface GetAcessosCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
}

type GetAcessosCamadaRasterUseCaseResponse = Either<
  null,
  {
    acessos: number;
  }
>;

@Injectable()
export class GetAcessosCamadaRasterUseCase {
  constructor(private camadasRasterLogRepository: CamadasRasterLogRepository) {}

  async execute({
    COD_CAMADA_RASTER_ID,
  }: GetAcessosCamadaRasterUseCaseRequest): Promise<GetAcessosCamadaRasterUseCaseResponse> {
    const acessos =
      await this.camadasRasterLogRepository.getAcessosByCamadasId(
        COD_CAMADA_RASTER_ID,
      );

    return right({
      acessos,
    });
  }
}
