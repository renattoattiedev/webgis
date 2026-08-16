import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { DeletePitometriaUseCase } from '@/domain/pitometria/application/use-cases/delete-pitometria';

@Controller('/pitometria/:id')
export class DeletePitometriaController {
  constructor(
    private deletePitometriaUseCase: DeletePitometriaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Delete()
  @HttpCode(200)
  async handle(@Req() request: Request, @Param('id') id: string) {
    const userLogin: UserPayload = request['user'];
    const COD_USER_ID = userLogin.sub;

    const perfil = await this.getUserPerfilUseCase.execute({ COD_USER_ID });
    if (!['Editor', 'Admin'].includes(perfil.value?.userPerfil ?? '')) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const result = await this.deletePitometriaUseCase.execute({
      id,
      COD_USUARIO_EXCLUSAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return { success: true };
  }
}
