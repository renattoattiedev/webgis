import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { AssociateFolderCamadaUseCase } from '@/domain/folder/application/use-cases/associate-folder-camada';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

const associateFolderCamadaBodySchema = z.object({
  COD_FOLDER_ID: z.string(),
  COD_CAMADA_ID: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(
  associateFolderCamadaBodySchema,
);

type AssociateFolderCamadaBodySchema = z.infer<
  typeof associateFolderCamadaBodySchema
>;

@Controller('/associate-folders-camadas')
export class AssociateFolderCamadaController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private associateCamadaToFolderUseCase: AssociateFolderCamadaUseCase,
  ) {}

  @Post()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(associateFolderCamadaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: AssociateFolderCamadaBodySchema,
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

    const { COD_FOLDER_ID, COD_CAMADA_ID } = body;

    await this.associateCamadaToFolderUseCase.execute({
      COD_FOLDER_CAMADADA_ID: new UniqueEntityID(),
      COD_FOLDER_ID,
      COD_CAMADA_ID,
    });

    return {
      message: 'Associação entre pasta e camada realizada com sucesso.',
    };
  }
}
