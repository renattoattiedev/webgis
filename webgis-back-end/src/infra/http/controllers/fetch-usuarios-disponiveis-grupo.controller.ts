import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { FetchUsuariosDisponiveisUseCase } from '@/domain/security/application/use-cases/fetch-usuarios-disponiveis';
import { UsuarioDisponivelPresenter } from '../presenters/usuario-disponivel-presenter';

@Controller('/grupos/usuarios-disponiveis')
export class FetchUsuariosDisponiveisGrupoController {
  constructor(
    private fetchUsuariosDisponiveisUseCase: FetchUsuariosDisponiveisUseCase,
  ) {}

  @Get()
  async handle(@CurrentUser() user?: UserPayload) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const result = await this.fetchUsuariosDisponiveisUseCase.execute();
    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar usuários');
    }

    return {
      usuarios: result.value.usuarios.map(UsuarioDisponivelPresenter.toHTTP),
    };
  }
}
