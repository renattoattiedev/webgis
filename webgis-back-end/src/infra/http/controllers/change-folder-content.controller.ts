import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UsePipes,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { AssociateFolderCamadaUseCase } from '@/domain/folder/application/use-cases/associate-folder-camada';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { z } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation-pipe';
import { FetchCamadasFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-camadas-folders';
import { DeleteCamadaFolderUseCase } from '@/domain/folder/application/use-cases/delete-camadas-folder';
import { DeleteMapaFolderUseCase } from '@/domain/folder/application/use-cases/delete-mapas-folder';
import { AssociateFolderMapaUseCase } from '@/domain/folder/application/use-cases/associate-folder-mapa';
import { FetchMapasFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-mapas-folders';
import { AssociateFolderCamadaRasterUseCase } from '@/domain/folder/application/use-cases/associate-folder-camada-raster';
import { DeleteCamadaRasterFolderUseCase } from '@/domain/folder/application/use-cases/delete-camadas-raster-folder';
import { FetchCamadasRasterFoldersUseCase } from '@/domain/folder/application/use-cases/fetch-camadas-raster-folders';

const associateFoldersCamadaBodySchema = z.object({
  contentType: z.string(),
  COD_CONTENT_ID: z.string(),
  COD_FOLDER_ID: z.string(),
  COD_FOLDER_OLD: z.string().optional(),
});

const bodyValidationPipe = new ZodValidationPipe(
  associateFoldersCamadaBodySchema,
);

type associateFoldersCamadaBodySchema = z.infer<
  typeof associateFoldersCamadaBodySchema
>;

@Controller('/change-folder-content')
export class ChangeCamadaFolderController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private associateFolderMapaUseCase: AssociateFolderMapaUseCase,
    private associateFolderCamadaUseCase: AssociateFolderCamadaUseCase,
    private associateFolderCamadaRasterUseCase: AssociateFolderCamadaRasterUseCase,
    private deleteMapaFolderUseCase: DeleteMapaFolderUseCase,
    private deleteCamadaFolderUseCase: DeleteCamadaFolderUseCase,
    private deleteCamadaRasterFolderUseCase: DeleteCamadaRasterFolderUseCase,
    private fetchCamadasFoldersUseCase: FetchCamadasFoldersUseCase,
    private fetchCamadasRasterFoldersUseCase: FetchCamadasRasterFoldersUseCase,
    private fetchMapasFoldersUseCase: FetchMapasFoldersUseCase,
  ) {}

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(associateFoldersCamadaBodySchema))
  async handle(
    @Req() request: Request,
    @Body(bodyValidationPipe) body: associateFoldersCamadaBodySchema,
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

    const { contentType, COD_CONTENT_ID, COD_FOLDER_ID, COD_FOLDER_OLD } = body;

    console.log(contentType, COD_CONTENT_ID, COD_FOLDER_ID, COD_FOLDER_OLD);

    if (contentType === 'vetorial') {
      const folderCamada = await this.fetchCamadasFoldersUseCase.execute({
        COD_FOLDER_ID: COD_FOLDER_OLD as string,
        COD_CAMADA_ID: COD_CONTENT_ID as string,
      });

      if (folderCamada.isRight() && folderCamada.value.folderCamadas) {
        const folderCamadaDetails = folderCamada.value;

        if (
          typeof folderCamadaDetails.folderCamadas.COD_FOLDER_CAMADADA_ID ===
          'undefined'
        ) {
          throw new BadRequestException('Folder camada ID is undefined.');
        } else {
          const deletionResult = await this.deleteCamadaFolderUseCase.execute({
            COD_FOLDER_CAMADADA_ID:
              folderCamadaDetails.folderCamadas.COD_FOLDER_CAMADADA_ID.toString(),
          });
          if (deletionResult.isLeft()) {
            throw new BadRequestException(deletionResult.value);
          }
        }
      }

      const associationResult = await this.associateFolderCamadaUseCase.execute(
        {
          COD_FOLDER_CAMADADA_ID: new UniqueEntityID(),
          COD_FOLDER_ID: COD_FOLDER_ID as string,
          COD_CAMADA_ID: COD_CONTENT_ID as string,
        },
      );

      if (associationResult.isLeft()) {
        const error = associationResult.value;
        if (error instanceof Error) {
          throw new BadRequestException(error.message);
        }
      }

      return { message: 'Operação realizada com sucesso.' };
    } else if (contentType === 'raster') {
      const folderCamadaRaster =
        await this.fetchCamadasRasterFoldersUseCase.execute({
          COD_FOLDER_ID: COD_FOLDER_OLD as string,
          COD_CAMADA_RASTER_ID: COD_CONTENT_ID as string,
        });
      console.log(COD_FOLDER_OLD, COD_CONTENT_ID);
      if (
        folderCamadaRaster.isRight() &&
        folderCamadaRaster.value.folderCamadas
      ) {
        const folderCamadaRasterDetails = folderCamadaRaster.value;

        console.log(folderCamadaRasterDetails);

        if (
          typeof folderCamadaRasterDetails.folderCamadas
            .COD_FOLDER_CAMADADA_RASTER_ID === 'undefined'
        ) {
          throw new BadRequestException(
            'Folder camada raster ID is undefined.',
          );
        } else {
          const deletionResult =
            await this.deleteCamadaRasterFolderUseCase.execute({
              COD_FOLDER_CAMADADA_RASTER_ID:
                folderCamadaRasterDetails.folderCamadas.COD_FOLDER_CAMADADA_RASTER_ID.toString(),
            });
          if (deletionResult.isLeft()) {
            throw new BadRequestException(deletionResult.value);
          }
        }
      }

      const associationResult =
        await this.associateFolderCamadaRasterUseCase.execute({
          COD_FOLDER_CAMADA_RASTER_ID: new UniqueEntityID(),
          COD_FOLDER_ID: COD_FOLDER_ID as string,
          COD_CAMADA_RASTER_ID: COD_CONTENT_ID as string,
        });

      if (associationResult.isLeft()) {
        const error = associationResult.value;
        if (error instanceof Error) {
          throw new BadRequestException(error.message);
        }
      }

      return { message: 'Operação realizada com sucesso.' };
    } else if (contentType === 'mapa') {
      const folderMapa = await this.fetchMapasFoldersUseCase.execute({
        COD_FOLDER_ID: COD_FOLDER_OLD as string,
        COD_MAPA_ID: COD_CONTENT_ID as string,
      });

      if (folderMapa.isRight() && folderMapa.value.folderMapas) {
        const folderMapaDetails = folderMapa.value;

        if (
          typeof folderMapaDetails.folderMapas.COD_FOLDER_MAPA_ID ===
          'undefined'
        ) {
          throw new BadRequestException('Folder mapa ID is undefined.');
        } else {
          const deletionResult = await this.deleteMapaFolderUseCase.execute({
            COD_FOLDER_MAPA_ID:
              folderMapaDetails.folderMapas.COD_FOLDER_MAPA_ID.toString(),
          });
          if (deletionResult.isLeft()) {
            throw new BadRequestException(deletionResult.value);
          }
        }
      }

      const associationResult = await this.associateFolderMapaUseCase.execute({
        COD_FOLDER_MAPA_ID: new UniqueEntityID(),
        COD_FOLDER_ID: COD_FOLDER_ID as string,
        COD_MAPA_ID: COD_CONTENT_ID as string,
      });

      if (associationResult.isLeft()) {
        const error = associationResult.value;
        if (error instanceof Error) {
          throw new BadRequestException(error.message);
        }
      }

      return { message: 'Operação realizada com sucesso.' };
    }
  }
}
