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
import { GetAcessosCamadaUseCase } from '@/domain/camadas/application/use-cases/get-acessos-camada';

@Controller('/get-acessos-camada/:camadaId')
export class GetAcessosCamadaController {
  constructor(
    private getAcessosCamadaUseCase: GetAcessosCamadaUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(
    @Req() request: Request,
    @Param('camadaId') COD_CAMADA_ID: string,
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
      const result = await this.getAcessosCamadaUseCase.execute({
        COD_CAMADA_ID,
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
          error: 'Ocorreu um erro ao buscar os acessos da Camada.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
