import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '../repositories/camadas-repository';

interface RecoveryCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
}

@Injectable()
export class RecoveryCamadaUseCase {
  constructor(private camadaRepository: CamadasRepository) {}

  async execute({ COD_CAMADA_ID }: RecoveryCamadaUseCaseRequest) {
    await this.camadaRepository.recoveryCamada(COD_CAMADA_ID);
  }
}
