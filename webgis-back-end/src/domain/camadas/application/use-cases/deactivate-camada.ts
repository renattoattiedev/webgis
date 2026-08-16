import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '../repositories/camadas-repository';
import { Camadas } from '../../enterprise/entities/camadas';

interface DeactivateCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
}

type DeactivateCamadaUseCaseResponse = Either<
  null,
  {
    camada: Camadas;
  }
>;

@Injectable()
export class DeactivateCamadaUseCase {
  constructor(private camadaRepository: CamadasRepository) {}

  async execute({
    COD_CAMADA_ID,
  }: DeactivateCamadaUseCaseRequest): Promise<DeactivateCamadaUseCaseResponse> {
    const camada = await this.camadaRepository.findById(COD_CAMADA_ID);

    if (!camada) {
      return left(null);
    }

    await this.camadaRepository.deactivateCamada(COD_CAMADA_ID);

    return right({
      camada: camada,
    });
  }
}
