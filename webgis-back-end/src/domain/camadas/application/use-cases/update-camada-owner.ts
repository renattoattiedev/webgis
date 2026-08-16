import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '../repositories/camadas-repository';

interface UpdateOwnerCamadaRequest {
  COD_CAMADA_ID: string;
  COD_USUARIO_CRIACAO: string;
  COD_NEW_OWNER: string;
}

@Injectable()
export class UpdateOwnerCamadaUseCase {
  constructor(private camadasRepository: CamadasRepository) {}

  async execute({
    COD_CAMADA_ID,
    COD_USUARIO_CRIACAO,
    COD_NEW_OWNER,
  }: UpdateOwnerCamadaRequest) {
    await this.camadasRepository.changeOwner(
      COD_CAMADA_ID,
      COD_USUARIO_CRIACAO,
      COD_NEW_OWNER,
    );
  }
}
