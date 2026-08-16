import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { DeleteBasemapUseCase } from '@/domain/basemaps/application/use-cases/delete-basemap';

@Controller('/delete-basemap/:basemapId')
export class DeleteBasemapController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteBasemapUseCase: DeleteBasemapUseCase,
  ) {}

  @Delete()
  async handle(
    @Req() request: Request,
    @Param('basemapId') COD_BASEMAP_ID: string,
  ) {
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

    const result = await this.deleteBasemapUseCase.execute({
      COD_BASEMAP_ID,
      COD_USUARIO_EXCLUSAO: USUARIO_AUTENTICADO,
    });

    if (result.isLeft()) {
      return {
        statusCode: 400,
        mensagem: result.value.mensagem,
      };
    }

    return {
      statusCode: 200,
      mensagem: 'Basemap excluído com sucesso',
    };
  }
}
