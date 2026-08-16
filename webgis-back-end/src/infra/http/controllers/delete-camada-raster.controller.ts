import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Logger,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { DeleteCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/delete-camada-raster';
import { MinioAPI } from '@/infra/modulos_ext/minio/minio-api';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

@Controller('/delete-camada-raster/:camadaId')
export class DeleteCamadaRasterController {
  private readonly logger = new Logger(DeleteCamadaRasterController.name);

  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteCamada: DeleteCamadaRasterUseCase,
    private geoserverClient: GeoserverAPI,
    private minioClient: MinioAPI,
  ) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @Req() request: Request,
    @Param('camadaId') COD_CAMADA_RASTER_ID: string,
  ) {
    const user: UserPayload = request['user'];
    const USUARIO_AUTENTICADO = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: USUARIO_AUTENTICADO,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    // 1. Soft-delete in DB (authoritative). If this fails, propagate as 400.
    const result = await this.deleteCamada.execute({
      COD_CAMADA_RASTER_ID,
      COD_USUARIO_EXCLUSAO: USUARIO_AUTENTICADO,
      COD_USER_SOLICITANTE: USUARIO_AUTENTICADO,
      DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
    });

    if (result.value instanceof NotAllowedError) {
      throw new ForbiddenException('Sem permissão para excluir este conteúdo');
    }

    if (result.value instanceof Error) {
      throw new BadRequestException(result.value.message);
    }

    const nomeCamada = result.value?.camadasRaster?.camadaNome;
    const fonteRaw = result.value?.camadasRaster?.camadaFonteDadosCamada;
    const fonteCamada = fonteRaw === 'uploaded' ? 'uploaded' : 'raster';

    if (!nomeCamada) return;

    // 2. Best-effort cleanup of external resources. The DB row is already
    // soft-deleted, so the camada is gone from the app's perspective even if
    // GeoServer or MinIO cleanup fails (e.g., the publish never reached
    // GeoServer because COG conversion failed). We log and swallow so the
    // client always sees the delete succeed.
    try {
      if (fonteCamada === 'uploaded') {
        await this.geoserverClient.deletarCamadaS3GeoTiff(
          `${nomeCamada}_${fonteCamada}`,
        );
      } else {
        await this.geoserverClient.deletarCamadaGeoTiff(
          `${nomeCamada}_${fonteCamada}`,
        );
      }
    } catch (err: any) {
      this.logger.warn(
        `Cleanup do GeoServer falhou para ${nomeCamada}_${fonteCamada} (camada já removida do DB): ${err?.message}`,
      );
    }

    if (fonteCamada === 'uploaded') {
      try {
        await this.minioClient.deletarArquivoMinio(nomeCamada);
      } catch (err: any) {
        this.logger.warn(
          `Cleanup do MinIO falhou para ${nomeCamada} (camada já removida do DB): ${err?.message}`,
        );
      }
    }
  }
}
