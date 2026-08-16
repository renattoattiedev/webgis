import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Req,
  UsePipes,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UpdateFolderUseCase } from '@/domain/folder/application/use-cases/update-folder';

const updateFoldersBodySchema = z.object({
  id: z.string(),
  descricao: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(updateFoldersBodySchema);

type UpdateFoldersBodySchema = z.infer<typeof updateFoldersBodySchema>;

@Controller('/update-folder')
export class UpdateFolderController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private updateFolder: UpdateFolderUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateFoldersBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateFoldersBodySchema,
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

    const { id: COD_FOLDER_ID, descricao: DSC_FOLDER } = body;

    const result = await this.updateFolder.execute({
      COD_FOLDER_ID,
      DSC_FOLDER,
      COD_USUARIO_ULTIMA_ALTERACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
    }
  }
}
