import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';

import { FetchUsersUseCase } from '@/domain/security/application/use-cases/fetch-users';
import { UserPresenter } from '../presenters/users-presenter';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { UserPayload } from '@/infra/auth/jwt.strategy';

@Controller('/fetch-usuarios')
export class FetchUsersController {
  constructor(
    private fetchUsers: FetchUsersUseCase,
    private getPerfil: GetUserPerfilUseCase,
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
      const result = await this.fetchUsers.execute();

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const users = result.value.users;

      const enrichUser = await Promise.all(
        users.map((users) => this.enrichUser(users)),
      );

      return { users: enrichUser };
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
