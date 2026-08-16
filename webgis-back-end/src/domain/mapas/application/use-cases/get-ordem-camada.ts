import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';

interface GetOrdemCamadaUseCaseRequest {
  COD_MAPA_ID: string;
  COD_CAMADA_ID: string;
}

type GetOrdemCamadaUseCaseResponse = Either<
  null,
  {
    ordem: number;
  }
>;

@Injectable()
export class GetOrdemCamadaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_CAMADA_ID,
  }: GetOrdemCamadaUseCaseRequest): Promise<GetOrdemCamadaUseCaseResponse> {
    const ordem = await this.mapasRepository.getOrdemCamada(
      COD_MAPA_ID,
      COD_CAMADA_ID,
    );

    if (!ordem) {
      return left(null);
    }

    return right({
      ordem,
    });
  }
}
