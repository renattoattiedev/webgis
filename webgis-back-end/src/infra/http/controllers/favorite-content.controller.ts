import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { RegisterCamadaFavoritaUseCase } from '@/domain/camadas/application/use-cases/register-camada-favorita';
import { DeleteCamadaFavoritaUseCase } from '@/domain/camadas/application/use-cases/delete-camada-favorita';
import { RegisterMapaFavoritoUseCase } from '@/domain/mapas/application/use-cases/register-mapa-favorito';
import { DeleteMapaFavoritoUseCase } from '@/domain/mapas/application/use-cases/delete-mapa-favorito';
import { RegisterCamadaRasterFavoritaUseCase } from '@/domain/camadas-raster/application/use-cases/register-camada-raster-favorita';
import { DeleteCamadaRasterFavoritaUseCase } from '@/domain/camadas-raster/application/use-cases/delete-camada-raster-favorita';

@Controller('/favorite-content/:contentType/:contentId')
export class FavoriteContentController {
  constructor(
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private registerCamadaFavoritaUseCase: RegisterCamadaFavoritaUseCase,
    private registerCamadaRasterFavoritaUseCase: RegisterCamadaRasterFavoritaUseCase,
    private registerMapaFavoritoUseCase: RegisterMapaFavoritoUseCase,
    private deleteCamadaFavoritaUseCase: DeleteCamadaFavoritaUseCase,
    private deleteCamadaRasterFavoritaUseCase: DeleteCamadaRasterFavoritaUseCase,
    private deleteMapaFavoritaUseCase: DeleteMapaFavoritoUseCase,
  ) {}

  @Put()
  @HttpCode(204)
  async handle(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Req() request: Request,
    @Query('action') ACTION: string,
  ) {
    const user: UserPayload = request['user'];

    const USUARIO_AUTENTICADO = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: USUARIO_AUTENTICADO,
    });

    if (
      perfil.value?.userPerfil !== 'Admin' &&
      perfil.value?.userPerfil !== 'Publicador'
    ) {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação',
      );
    }

    if (contentType === 'vetorial') {
      if (ACTION === 'marcar') {
        await this.registerCamadaFavoritaUseCase.execute({
          COD_CAMADA_ID: contentId,
          COD_USER_ID: USUARIO_AUTENTICADO,
        });
      } else if (ACTION === 'desmarcar') {
        await this.deleteCamadaFavoritaUseCase.execute({
          COD_CAMADA_ID: contentId,
          COD_USER_ID: USUARIO_AUTENTICADO,
        });
      }
    }

    if (contentType === 'raster') {
      if (ACTION === 'marcar') {
        await this.registerCamadaRasterFavoritaUseCase.execute({
          COD_CAMADA_RASTER_ID: contentId,
          COD_USER_ID: USUARIO_AUTENTICADO,
        });
      } else if (ACTION === 'desmarcar') {
        await this.deleteCamadaRasterFavoritaUseCase.execute({
          COD_CAMADA_RASTER_ID: contentId,
          COD_USER_ID: USUARIO_AUTENTICADO,
        });
      }
    }

    if (contentType === 'mapa') {
      if (ACTION === 'marcar') {
        await this.registerMapaFavoritoUseCase.execute({
          COD_MAPA_ID: contentId,
          COD_USER_ID: USUARIO_AUTENTICADO,
        });
      } else if (ACTION === 'desmarcar') {
        await this.deleteMapaFavoritaUseCase.execute({
          COD_MAPA_ID: contentId,
          COD_USER_ID: USUARIO_AUTENTICADO,
        });
      }
    }

    return;
  }
}
