import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';

import { FetchPerfilUseCase } from '@/domain/security/application/use-cases/fetch-perfil';
import { PerfilPresenter } from '../presenters/perfil-presenter';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';

@Controller('/fetch-perfis')
export class FetchPerfilController {
  constructor(
    private fetchPerfil: FetchPerfilUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(@Req() request: Request) {
    const user: UserPayload = request['user'];

    const COD_USER_ID = user.sub;

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID,
    });

    if (perfil.value?.userPerfil !== 'Admin') {
      throw new BadRequestException(
        'Usuário não possui privilégios para realizar esta operação.',
      );
    }

    try {
      const result = await this.fetchPerfil.execute();

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const perfis = result.value.perfil;

      return { perfis: perfis.map(PerfilPresenter.toHTTP) };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os Perfis.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
