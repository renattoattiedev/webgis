import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { DeleteTemaUseCase } from '@/domain/manager/application/use-cases/delete-tema';

@Controller('/delete-tema/:temaId')
export class DeleteTemaController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteTemaUseCase: DeleteTemaUseCase,
  ) {}

  @Delete()
  async handle(@Req() request: Request, @Param('temaId') COD_TEMA_ID: string) {
    try {
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

      const result = await this.deleteTemaUseCase.execute({
        COD_TEMA_ID,
        COD_USUARIO_EXCLUSAO: USUARIO_AUTENTICADO,
      });

      if (result.isLeft()) {
        const error = result.value;
        return {
          statusCode: 400,
          mensagem: error.mensagem,
        };
      } else {
        return {
          statusCode: 200,
          mensagem: 'Tema excluído com sucesso',
        };
      }
    } catch (error) {
      return { mensagem: 'Erro interno do servidor' };
    }
  }
}
