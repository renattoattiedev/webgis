import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { CreateFolderUseCase } from '@/domain/folder/application/use-cases/create-folder';

const createFoldersBodySchema = z.object({
  COD_FOLDER_ID: z.string().optional(),
  descricao: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(createFoldersBodySchema);

type CreateFoldersBodySchema = z.infer<typeof createFoldersBodySchema>;

@Controller('/create-folder')
export class CreateFolderController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private createFolder: CreateFolderUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(createFoldersBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: CreateFoldersBodySchema,
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

    const { descricao: DSC_FOLDER } = body;

    const result = await this.createFolder.execute({
      COD_FOLDER_ID: new UniqueEntityID(),
      DSC_FOLDER,
      COD_USUARIO_CRIACAO: COD_USER_ID,
    });

    if (result.isLeft()) {
      const error = result.value;
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
    }
  }
}
