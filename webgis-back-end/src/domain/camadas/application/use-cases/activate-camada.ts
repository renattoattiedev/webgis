import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '../repositories/camadas-repository';
import { Camadas } from '../../enterprise/entities/camadas';

interface ActivateCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
}

type ActivateCamadaUseCaseResponse = Either<
  null,
  {
    camada: Camadas;
  }
>;

@Injectable()
export class ActivateCamadaUseCase {
  constructor(private camadaRepository: CamadasRepository) {}

  async execute({
    COD_CAMADA_ID,
  }: ActivateCamadaUseCaseRequest): Promise<ActivateCamadaUseCaseResponse> {
    const camada = await this.camadaRepository.findById(COD_CAMADA_ID);

    if (!camada) {
      return left(null);
    }

    await this.camadaRepository.activateCamada(COD_CAMADA_ID);

    return right({
      camada: camada,
    });
  }
}
