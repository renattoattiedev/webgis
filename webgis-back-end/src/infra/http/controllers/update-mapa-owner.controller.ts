import { GetFolderMapaUseCase } from './../../../domain/folder/application/use-cases/get-folder-mapa';
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
import { UpdateOwnerMapaUseCase } from '@/domain/mapas/application/use-cases/update-mapa-owner';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { DeleteMapaFolderUseCase } from '@/domain/folder/application/use-cases/delete-mapas-folder';

const updateOwnerMapaBodySchema = z.object({
  COD_MAPA_ID: z.string(),
  COD_NEW_OWNER: z.string(),
});
const bodyValidationPipe = new ZodValidationPipe(updateOwnerMapaBodySchema);

type UpdateOwnerMapaBodySchema = z.infer<typeof updateOwnerMapaBodySchema>;

@Controller('/update-mapa-owner')
export class UpdateMapaOwnerController {
  constructor(
    private updateOwnerMapaUseCase: UpdateOwnerMapaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private getFolderMapaUseCase: GetFolderMapaUseCase,
    private deleteMapaFolderUseCase: DeleteMapaFolderUseCase,
  ) {}

  @Put()
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(updateOwnerMapaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: UpdateOwnerMapaBodySchema,
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

    const { COD_MAPA_ID, COD_NEW_OWNER } = body;

    try {
      const result = await this.getFolderMapaUseCase.execute({
        COD_MAPA_ID,
        COD_USER_ID: id.toString(),
      });

      const folder_mapa = result.value;

      if (folder_mapa) {
        await this.deleteMapaFolderUseCase.execute({
          COD_FOLDER_MAPA_ID: folder_mapa.id.toString(),
        });
      }
    } catch (error) {
      throw new BadRequestException(error);
    }

    try {
      await this.updateOwnerMapaUseCase.execute({
        COD_MAPA_ID,
        COD_USUARIO_CRIACAO: id,
        COD_NEW_OWNER,
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
