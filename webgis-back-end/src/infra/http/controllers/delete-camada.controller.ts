import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import {
  DeleteCamadaUseCase,
  CamadaAssociadoAComponenteError,
} from '@/domain/camadas/application/use-cases/delete-camada';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

@Controller('/delete-camada/:camadaId')
export class DeleteCamadaController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteCamada: DeleteCamadaUseCase,
    private geoserverClient: GeoserverAPI,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
  ) {}

  @Delete()
  @HttpCode(200)
  async handle(
    @Req() request: Request,
    @Param('camadaId') COD_CAMADA_ID: string,
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

    const result = await this.deleteCamada.execute({
      COD_CAMADA_ID,
      COD_USUARIO_EXCLUSAO: USUARIO_AUTENTICADO,
      COD_USER_SOLICITANTE: USUARIO_AUTENTICADO,
      DSC_PERFIL_SOLICITANTE: perfil.value?.userPerfil ?? null,
    });

    // Verificar se houve erro - especialmente associação com componentes
    if (result.isLeft()) {
      const error = result.value;

      if (error instanceof NotAllowedError) {
        throw new ForbiddenException(
          'Sem permissão para excluir este conteúdo',
        );
      }

      // Erro específico: camada associada a componentes
      if (error instanceof CamadaAssociadoAComponenteError) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            error: 'CAMADA_ASSOCIADA_A_COMPONENTES',
            data: {
              componentes: error.componentes,
              totalAssociacoes: error.componentes.length,
            },
          },
          HttpStatus.CONFLICT, // 409
        );
      }

      // Erro genérico (camada não encontrada, etc)
      throw new BadRequestException({
        success: false,
        message: 'Erro ao deletar camada',
        error: 'DELETE_CAMADA_ERROR',
      });
    }

    // Sucesso - deletar do Geoserver
    const pacoteConceitual = result.value?.camada?.camadaPacotesConceituais;

    if (pacoteConceitual) {
      const pacoteConceitualNome = await this.fetchPacotesConceituais.execute({
        COD_PACOTE_CONCEITUAL_ID: pacoteConceitual,
      });

      if (pacoteConceitualNome.isLeft()) {
        throw new BadRequestException('Erro ao buscar pacote conceitual');
      }

      this.geoserverClient.deleteCamada(
        result.value?.camada?.camadaNome,
        pacoteConceitualNome.value.pacotesConceituais.pacoteConceitualNome.toString(),
      );
    }

    return {
      success: true,
      message: 'Camada deletada com sucesso',
      data: null,
    };
  }
}
