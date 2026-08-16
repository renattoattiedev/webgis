import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  Param,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { DeleteFolderUseCase } from '@/domain/folder/application/use-cases/delete-folder';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';

@Controller('/delete-folder/:folderId')
export class DeleteFolderController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private deleteFolder: DeleteFolderUseCase,
  ) {}

  @Delete()
  @HttpCode(204)
  async handle(
    @Req() request: Request,
    @Param('folderId') COD_FOLDER_ID: string,
  ) {
    const user: UserPayload = request['user'];

    const COD_USER_ID = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const result = await this.deleteFolder.execute({
      COD_FOLDER_ID,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
    }
  }
}
