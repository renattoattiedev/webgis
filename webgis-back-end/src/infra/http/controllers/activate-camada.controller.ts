import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { ActivateCamadaUseCase } from '@/domain/camadas/application/use-cases/activate-camada';
import { DeactivateCamadaUseCase } from '@/domain/camadas/application/use-cases/deactivate-camada';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { ActivateCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/activate-camada-raster';
import { DeactivateCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/deactivate-camada-raster';

@Controller('/activate-camada/:camadaId')
export class ActivateCamadaController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private activateCamada: ActivateCamadaUseCase,
    private activateCamadaRaster: ActivateCamadaRasterUseCase,
    private deactivateCamada: DeactivateCamadaUseCase,
    private deactivateCamadaRaster: DeactivateCamadaRasterUseCase,
    private getGeoServerApi: GeoserverAPI,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
  ) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Req() request: Request,
    @Param('camadaId') COD_CAMADA_ID: string,
    @Query('tipo') tipo: string,
    @Query('action') ACTION: string,
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

    if (ACTION === 'activate') {
      if (tipo === 'vetorial') {
        const camadaToEnable = await this.activateCamada.execute({
          COD_CAMADA_ID,
        });
        if (camadaToEnable.value) {
          const pacoteConceitualNome = await this.getPacoteConceitualNome(
            camadaToEnable.value.camada.camadaPacotesConceituais,
          );
          await this.getGeoServerApi.habilitarCamada(
            pacoteConceitualNome,
            camadaToEnable.value.camada.camadaNome,
          );
        }
      } else {
        const camadaToEnable = await this.activateCamadaRaster.execute({
          COD_CAMADA_RASTER_ID: COD_CAMADA_ID,
        });
        if (camadaToEnable.value) {
          const fonte =
            camadaToEnable.value.camadaRaster.camadaFonteDadosCamada ===
            'uploaded'
              ? 'uploaded'
              : 'raster';
          await this.getGeoServerApi.habilitarCamadaRaster(
            `${camadaToEnable.value.camadaRaster.camadaNome}_${fonte}`,
          );
        }
      }
    } else {
      if (tipo === 'vetorial') {
        const camadaToDisable = await this.deactivateCamada.execute({
          COD_CAMADA_ID,
        });
        if (camadaToDisable.value) {
          const pacoteConceitualNome = await this.getPacoteConceitualNome(
            camadaToDisable.value.camada.camadaPacotesConceituais,
          );
          await this.getGeoServerApi.desabilitarCamada(
            pacoteConceitualNome,
            camadaToDisable.value.camada.camadaNome,
          );
        }
      } else {
        const camadaToDisable = await this.deactivateCamadaRaster.execute({
          COD_CAMADA_RASTER_ID: COD_CAMADA_ID,
        });
        if (camadaToDisable.value) {
          const fonte =
            camadaToDisable.value.camadaRaster.camadaFonteDadosCamada ===
            'uploaded'
              ? 'uploaded'
              : 'raster';
          await this.getGeoServerApi.desabilitarCamadaRaster(
            `${camadaToDisable.value.camadaRaster.camadaNome}_${fonte}`,
          );
        }
      }
    }

    return;
  }

  private async getPacoteConceitualNome(
    codPacoteConceitualId: string,
  ): Promise<string> {
    const result = await this.fetchPacotesConceituais.execute({
      COD_PACOTE_CONCEITUAL_ID: codPacoteConceitualId,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar pacote conceitual');
    }

    return result.value.pacotesConceituais.pacoteConceitualNome;
  }
}
