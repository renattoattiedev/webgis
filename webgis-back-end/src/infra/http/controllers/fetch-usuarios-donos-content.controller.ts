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
import { FetchUsersProfileUseCase } from '@/domain/security/application/use-cases/fetch-users-profile';
import { FetchPerfilUseCase } from '@/domain/security/application/use-cases/fetch-perfil';

@Controller('/fetch-usuarios-donos-content')
export class FetchUsersOwnersCamadasController {
  constructor(
    private fetchUsers: FetchUsersProfileUseCase,
    private getPerfil: GetUserPerfilUseCase,
    private fethProfile: FetchPerfilUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(@Req() request: Request) {
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
      const result_perfis = await this.fethProfile.execute();
      if (result_perfis.isLeft()) {
        throw new BadRequestException();
      }
      const perfis = result_perfis.value.perfil;

      const perfisFiltrados = perfis.filter(
        (perfil) =>
          perfil.descricaoPerfil === 'Admin' ||
          perfil.descricaoPerfil === 'Publicador',
      );

      const COD_PERFIL_USER = perfisFiltrados.map((perfil) =>
        perfil.id.toString(),
      );

      const result_users = await this.fetchUsers.execute({
        COD_PERFIL_USER: COD_PERFIL_USER,
      });

      if (result_users.isLeft()) {
        throw new BadRequestException();
      }

      const users = result_users.value.users;

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
