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
import { UpdateOwnerCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/update-camada-raster-owner';
import { GetFolderCamadaRasterUseCase } from '@/domain/folder/application/use-cases/get-folder-camada-raster';
import { DeleteCamadaRasterFolderUseCase } from '@/domain/folder/application/use-cases/delete-camadas-raster-folder';

const updateOwnerCamadaRasterBodySchema = z.object({
  COD_CAMADA_RASTER_ID: z.string(),
  COD_NEW_OWNER: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(
  updateOwnerCamadaRasterBodySchema,
);

type UpdateOwnerCamadaRasterBodySchema = z.infer<
  typeof updateOwnerCamadaRasterBodySchema
>;

@Controller('/update-camada-raster-owner')
export class UpdateCamadaRasterOwnerController {
  constructor(
    private updateOwnerCamadaRasterUseCase: UpdateOwnerCamadaRasterUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private getFolderCamadaRasterUseCase: GetFolderCamadaRasterUseCase,
    private deleteCamadaRasterFolderUseCase: DeleteCamadaRasterFolderUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateOwnerCamadaRasterBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateOwnerCamadaRasterBodySchema,
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

    const { COD_CAMADA_RASTER_ID, COD_NEW_OWNER } = body;

    try {
      const result = await this.getFolderCamadaRasterUseCase.execute({
        COD_CAMADA_RASTER_ID,
        COD_USER_ID: id.toString(),
      });

      const folder_camada = result.value;

      if (folder_camada) {
        await this.deleteCamadaRasterFolderUseCase.execute({
          COD_FOLDER_CAMADADA_RASTER_ID: folder_camada.id.toString(),
        });
      }
    } catch (error) {
      throw new BadRequestException(error);
    }

    try {
      await this.updateOwnerCamadaRasterUseCase.execute({
        COD_CAMADA_RASTER_ID,
        COD_USUARIO_CRIACAO: id,
        COD_NEW_OWNER,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
