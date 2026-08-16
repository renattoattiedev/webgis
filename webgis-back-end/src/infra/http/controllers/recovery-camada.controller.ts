import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Put,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { RecoveryCamadaUseCase } from '@/domain/camadas/application/use-cases/recovery-camada';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';

@Controller('/recovery-camada/:camadaId')
export class RecoveryCamadaController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private recoveryCamadaUseCase: RecoveryCamadaUseCase,
  ) {}

  @Put()
  @HttpCode(204)
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

    try {
      await this.recoveryCamadaUseCase.execute({
        COD_CAMADA_ID,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
