import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Req,
} from '@nestjs/common';

import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetAcessosCamadaRasterUseCase } from '@/domain/camadas-raster/application/use-cases/get-acessos-camada-raster';

@Controller('/get-acessos-camada-raster/:camadaId')
export class GetAcessosCamadaRasterController {
  constructor(
    private getAcessosCamadaRasterUseCase: GetAcessosCamadaRasterUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(
    @Req() request: Request,
    @Param('camadaId') COD_CAMADA_RASTER_ID: string,
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
      const result = await this.getAcessosCamadaRasterUseCase.execute({
        COD_CAMADA_RASTER_ID,
      });

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const acessos = result.value.acessos;

      return { acessos: Number(acessos) ? acessos : 0 };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os acessos da Camada Raster.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
