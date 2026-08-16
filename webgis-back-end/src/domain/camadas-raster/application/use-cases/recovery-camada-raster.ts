import { Injectable } from '@nestjs/common';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';

interface RecoveryCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
}

@Injectable()
export class RecoveryCamadaRasterUseCase {
  constructor(private camadasRasterRepository: CamadasRasterRepository) {}

  async execute({ COD_CAMADA_RASTER_ID }: RecoveryCamadaRasterUseCaseRequest) {
    await this.camadasRasterRepository.recoveryCamada(COD_CAMADA_RASTER_ID);
  }
}
