import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-folders';
import { FoldersPresenter } from '../presenters/folders-presenter';

@Controller('/fetch-folders')
export class FetchFoldersController {
  constructor(
    private fetchFoldersUseCase: FetchFoldersUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async fetchCamadasByFolderId(
    @Param('COD_FOLDER_ID') COD_FOLDER_ID: string,
    @Req() request: Request,
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
        'Usuário não possui privilégios para realizar esta operação.',
      );
    }

    try {
      const result = await this.fetchFoldersUseCase.execute({
        COD_USUARIO_CRIACAO: COD_USER_ID,
      });

      if (result.isLeft()) {
        throw new Error('Falha ao buscar pastas');
      }

      const folders = result.value.folder.map(FoldersPresenter.toHTTP);

      return { folders };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar as pastas.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
