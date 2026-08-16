import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { DeleteGrupoUseCase } from '@/domain/manager/application/use-cases/delete-grupo';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { GrupoRepository } from '@/domain/manager/application/repositories/grupo-repository';

@Controller('/delete-grupo/:grupoId')
export class DeleteGrupoController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteGrupoUseCase: DeleteGrupoUseCase,
    private grupoAccessPolicy: GrupoAccessPolicy,
    private grupoRepository: GrupoRepository,
  ) {}

  @Delete()
  async handle(
    @Req() request: Request,
    @Param('grupoId') COD_GRUPO_ID: string,
  ) {
    try {
      const user: UserPayload = request['user'];

      const USUARIO_AUTENTICADO = user.sub;

      const perfil = await this.getUserPerfilUseCase.execute({
        COD_USER_ID: USUARIO_AUTENTICADO,
      });

      const grupo = await this.grupoRepository.findById(COD_GRUPO_ID);
      if (!grupo) {
        throw new BadRequestException('Grupo não encontrado');
      }

      const ctx = await this.grupoAccessPolicy.buildContext(
        USUARIO_AUTENTICADO,
        perfil.isRight() ? perfil.value.userPerfil : null,
      );

      if (!this.grupoAccessPolicy.canManageGrupo(ctx, grupo)) {
        throw new BadRequestException(
          'Usuário não possui privilégios para realizar esta operação',
        );
      }

      const result = await this.deleteGrupoUseCase.execute({
        COD_GRUPO_ID,
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
          mensagem: 'Grupo excluído com sucesso',
        };
      }
    } catch (error) {
      return { mensagem: 'Erro interno do servidor' };
    }
  }
}
