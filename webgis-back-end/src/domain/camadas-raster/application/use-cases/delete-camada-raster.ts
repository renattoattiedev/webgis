import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { CamadasRaster } from '../../enterprise/entities/camadas-raster';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface DeleteCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
  COD_USUARIO_EXCLUSAO: string;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

type DeleteCamadaRasterUseCaseResponse = Either<
  NotAllowedError | null,
  {
    camadasRaster: CamadasRaster;
  }
>;

@Injectable()
export class DeleteCamadaRasterUseCase {
  constructor(
    private camadasRasterRepository: CamadasRasterRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    COD_USUARIO_EXCLUSAO,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: DeleteCamadaRasterUseCaseRequest): Promise<DeleteCamadaRasterUseCaseResponse> {
    const camadasRaster =
      await this.camadasRasterRepository.findById(COD_CAMADA_RASTER_ID);

    if (!camadasRaster) {
      return left(null);
    }

    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      const permitido = this.grupoAccessPolicy.canEditGroupContentByGrupoId(
        ctx,
        camadasRaster.camadaGruposCamadas,
        camadasRaster.camadaUsuarioCriacao,
      );
      if (!permitido) {
        return left(new NotAllowedError());
      }
    }

    await this.camadasRasterRepository.deleteCamada(
      COD_CAMADA_RASTER_ID,
      COD_USUARIO_EXCLUSAO,
    );

    return right({
      camadasRaster,
    });
  }
}
