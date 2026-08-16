import { BadRequestException, Controller, Get } from '@nestjs/common';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { FetchGruposOverviewUseCase } from '@/domain/manager/application/use-cases/fetch-grupos-overview';
import { GrupoOverviewPresenter } from '../presenters/grupo-overview-presenter';

@Controller('/grupos/overview')
export class FetchGruposOverviewController {
  constructor(
    private fetchGruposOverviewUseCase: FetchGruposOverviewUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
  ) {}

  @Get()
  async handle(@CurrentUser() user?: UserPayload) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: user.sub,
    });

    const result = await this.fetchGruposOverviewUseCase.execute({
      COD_USER_ID: user.sub,
      DSC_PERFIL: perfil.isRight() ? perfil.value.userPerfil : null,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar grupos');
    }

    return {
      grupos: result.value.grupos.map(GrupoOverviewPresenter.toHTTP),
    };
  }
}
