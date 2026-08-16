import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { DeleteMapaUseCase } from '@/domain/mapas/application/use-cases/delete-mapa';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

@Controller('/delete-mapa/:mapaId')
export class DeleteMapaController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteMapa: DeleteMapaUseCase,
    private geoserverClient: GeoserverAPI,
  ) {}

  @Delete()
  @HttpCode(204)
  async handle(@Req() request: Request, @Param('mapaId') COD_MAPA_ID: string) {
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

    const result = await this.deleteMapa.execute({
      COD_MAPA_ID,
      COD_USUARIO_EXCLUSAO: USUARIO_AUTENTICADO,
      COD_USER_SOLICITANTE: USUARIO_AUTENTICADO,
      DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
    });

    if (result.isRight()) {
      const { mapa } = result.value;
      if (mapa) {
        await this.geoserverClient.deletarMapas(mapa.mapaNome);
      }
    } else {
      const error = result.value;
      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Sem permissão para excluir este conteúdo',
        );
      }
      throw new BadRequestException(error.mensagem);
    }
  }
}
