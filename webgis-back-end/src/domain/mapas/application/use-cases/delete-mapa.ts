import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface DeleteMapaUseCaseRequest {
  COD_MAPA_ID: string;
  COD_USUARIO_EXCLUSAO: string;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

type DeleteMapaUseCaseResponse = Either<
  | {
      mensagem: string;
    }
  | NotAllowedError,
  {
    mapa: Mapas;
    camadas: Camadas[];
  }
>;

@Injectable()
export class DeleteMapaUseCase {
  constructor(
    private mapasRepository: MapasRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_MAPA_ID,
    COD_USUARIO_EXCLUSAO,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: DeleteMapaUseCaseRequest): Promise<DeleteMapaUseCaseResponse> {
    const { mapa, camadas } = await this.mapasRepository.findById(COD_MAPA_ID);

    if (!mapa) {
      return left({
        mensagem: 'Mapa não encontrado',
      });
    }

    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      const permitido = this.grupoAccessPolicy.canEditGroupContentByGrupoId(
        ctx,
        mapa.mapaGrupo,
        mapa.mapaUsuarioCriacao,
      );
      if (!permitido) {
        return left(new NotAllowedError());
      }
    }

    await this.mapasRepository.deleteMapa(COD_MAPA_ID, COD_USUARIO_EXCLUSAO);

    return right({
      mapa,
      camadas,
    });
  }
}
