import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Put,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { RecoveryUserUseCase } from '@/domain/security/application/use-cases/recovery-user';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';

@Controller('/recovery-user/:userId')
export class RecoveryUserController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private recoveryUserUseCase: RecoveryUserUseCase,
  ) {}

  @Put()
  @HttpCode(204)
  async handle(@Req() request: Request, @Param('userId') COD_USER_ID: string) {
    const user: UserPayload = request['user'];

    const USUARIO_AUTENTICADO = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: USUARIO_AUTENTICADO,
    });

    if (perfil.value?.userPerfil !== 'Admin') {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    try {
      await this.recoveryUserUseCase.execute({
        COD_USER_ID,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
