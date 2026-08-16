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
import { UpdateOwnerCamadaUseCase } from '@/domain/camadas/application/use-cases/update-camada-owner';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { DeleteCamadaFolderUseCase } from '@/domain/folder/application/use-cases/delete-camadas-folder';
import { GetFolderCamadaUseCase } from '@/domain/folder/application/use-cases/get-folder-camada';

const updateOwnerCamadaBodySchema = z.object({
  COD_CAMADA_ID: z.string(),
  COD_NEW_OWNER: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(updateOwnerCamadaBodySchema);

type UpdateOwnerCamadaBodySchema = z.infer<typeof updateOwnerCamadaBodySchema>;

@Controller('/update-camada-owner')
export class UpdateCamadaOwnerController {
  constructor(
    private updateOwnerCamadaUseCase: UpdateOwnerCamadaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private getFolderCamadaUseCase: GetFolderCamadaUseCase,
    private deleteCamadaFolderUseCase: DeleteCamadaFolderUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateOwnerCamadaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateOwnerCamadaBodySchema,
  ) {
    const user: UserPayload = request['user'];

    const id = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: id,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    const { COD_CAMADA_ID, COD_NEW_OWNER } = body;

    try {
      const result = await this.getFolderCamadaUseCase.execute({
        COD_CAMADA_ID,
        COD_USER_ID: id.toString(),
      });

      const folder_camada = result.value;

      if (folder_camada) {
        await this.deleteCamadaFolderUseCase.execute({
          COD_FOLDER_CAMADADA_ID: folder_camada.id.toString(),
        });
      }
    } catch (error) {
      throw new BadRequestException(error);
    }

    try {
      await this.updateOwnerCamadaUseCase.execute({
        COD_CAMADA_ID,
        COD_USUARIO_CRIACAO: id,
        COD_NEW_OWNER,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
