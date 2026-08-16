import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { DeleteUserUseCase } from '@/domain/security/application/use-cases/delete-user';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';

@Controller('/delete-user/:userId')
export class DeleteUserController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteUser: DeleteUserUseCase,
  ) {}

  @Delete()
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

    const result = await this.deleteUser.execute({
      COD_USER_ID,
      COD_USUARIO_EXCLUSAO: USUARIO_AUTENTICADO,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
    }
  }
}
