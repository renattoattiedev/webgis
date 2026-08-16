import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '../repositories/camadas-repository';
import { Camadas } from '../../enterprise/entities/camadas';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

export class CamadaAssociadoAComponenteError extends Error {
  constructor(
    public readonly componentes: Array<{
      id: string;
      nome: string;
    }>,
  ) {
    super(
      `Camada associada a ${componentes.length} componente(s). Remova as associações antes de deletar.`,
    );
    this.name = 'CamadaAssociadoAComponenteError';
  }
}

interface DeleteCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
  COD_USUARIO_EXCLUSAO: string;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

type DeleteCamadaUseCaseResponse = Either<
  CamadaAssociadoAComponenteError | NotAllowedError | null,
  {
    camada: Camadas;
  }
>;

@Injectable()
export class DeleteCamadaUseCase {
  constructor(
    private camadaRepository: CamadasRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_CAMADA_ID,
    COD_USUARIO_EXCLUSAO,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: DeleteCamadaUseCaseRequest): Promise<DeleteCamadaUseCaseResponse> {
    const camada = await this.camadaRepository.findById(COD_CAMADA_ID);

    if (!camada) {
      return left(null);
    }

    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      const permitido = this.grupoAccessPolicy.canEditGroupContentByGrupoId(
        ctx,
        camada.camadaGruposCamadas,
        camada.camadaUsuarioCriacao,
      );
      if (!permitido) {
        return left(new NotAllowedError());
      }
    }

    // Verificar se a camada está associada a componentes
    const componentes =
      await this.camadaRepository.findComponentsAssociatedWithCamada(
        COD_CAMADA_ID,
      );

    if (componentes.length > 0) {
      return left(
        new CamadaAssociadoAComponenteError(
          componentes.map((c) => ({
            id: c.COD_COMPONENTE_ID,
            nome: c.NOM_NOME_COMPONENTE,
          })),
        ),
      );
    }

    await this.camadaRepository.deleteCamada(
      COD_CAMADA_ID,
      COD_USUARIO_EXCLUSAO,
    );

    return right({
      camada: camada,
    });
  }
}
