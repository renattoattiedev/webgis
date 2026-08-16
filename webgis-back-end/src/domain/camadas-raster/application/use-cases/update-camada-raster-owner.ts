import { Injectable } from '@nestjs/common';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';

interface UpdateOwnerCamadaRasterRequest {
  COD_CAMADA_RASTER_ID: string;
  COD_USUARIO_CRIACAO: string;
  COD_NEW_OWNER: string;
}

@Injectable()
export class UpdateOwnerCamadaRasterUseCase {
  constructor(private camadasRasterRepository: CamadasRasterRepository) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    COD_USUARIO_CRIACAO,
    COD_NEW_OWNER,
  }: UpdateOwnerCamadaRasterRequest) {
    await this.camadasRasterRepository.changeOwner(
      COD_CAMADA_RASTER_ID,
      COD_USUARIO_CRIACAO,
      COD_NEW_OWNER,
    );
  }
}
