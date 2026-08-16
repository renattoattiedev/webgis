import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';

import { UserPresenter } from '../presenters/users-presenter';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';

@Controller('/get-user-perfil')
export class GetUserPerfilController {
  constructor(
    private getUserUseCase: GetUserUseCase,
    private getPerfil: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(@Req() request: Request) {
    const user: UserPayload = request['user'];

    const COD_USER_ID = user.sub;

    try {
      const result = await this.getUserUseCase.execute({ COD_USER_ID });

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const user = result.value.user;

      const enrichUser = await this.enrichUser(user);
      return { user: enrichUser };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os Usuários.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private async enrichUser(user: any): Promise<any> {
    const COD_USER_ID = user.id.value;

    const perfil = await this.getPerfil.execute({
      COD_USER_ID,
    });

    return {
      ...UserPresenter.toHTTP(user),
      perfil: perfil.value?.userPerfil,
    };
  }
}
