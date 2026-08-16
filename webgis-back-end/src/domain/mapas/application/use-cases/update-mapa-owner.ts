import { Injectable } from '@nestjs/common';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';

interface UpdateOwnerMapaRequest {
  COD_MAPA_ID: string;
  COD_USUARIO_CRIACAO: string;
  COD_NEW_OWNER: string;
}

@Injectable()
export class UpdateOwnerMapaUseCase {
  constructor(private mapasRepository: MapasRepository) {}

  async execute({
    COD_MAPA_ID,
    COD_USUARIO_CRIACAO,
    COD_NEW_OWNER,
  }: UpdateOwnerMapaRequest) {
    await this.mapasRepository.changeOwner(
      COD_MAPA_ID,
      COD_USUARIO_CRIACAO,
      COD_NEW_OWNER,
    );
  }
}
