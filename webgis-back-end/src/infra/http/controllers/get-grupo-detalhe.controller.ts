import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { CurrentUser } from '@/infra/auth/current-user-decorator';
import { UserPayload } from '@/infra/auth/jwt.strategy';
import { GetUserPerfilUseCase } from '@/domain/security/application/use-cases/get-perfil-user';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { GetGrupoDetalheUseCase } from '@/domain/manager/application/use-cases/get-grupo-detalhe';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { GrupoMembroPresenter } from '../presenters/grupo-membro-presenter';
import { GrupoOverviewPresenter } from '../presenters/grupo-overview-presenter';

@Controller('/grupos/:grupoId')
export class GetGrupoDetalheController {
  constructor(
    private getGrupoDetalheUseCase: GetGrupoDetalheUseCase,
    private getUserPerfilUseCase: GetUserPerfilUseCase,
    private getUserUseCase: GetUserUseCase,
  ) {}

  @Get()
  async handle(
    @Param('grupoId') COD_GRUPO_ID: string,
    @CurrentUser() user?: UserPayload,
  ) {
    if (!user) throw new BadRequestException('Usuário não autenticado!');

    const perfil = await this.getUserPerfilUseCase.execute({
      COD_USER_ID: user.sub,
    });

    const result = await this.getGrupoDetalheUseCase.execute({
      COD_GRUPO_ID,
      COD_USER_ID: user.sub,
      DSC_PERFIL: perfil.isRight() ? perfil.value.userPerfil : null,
    });

    if (result.isLeft()) {
      if (result.value instanceof NotAllowedError) {
        throw new ForbiddenException('Sem acesso a este grupo');
      }
      throw new NotFoundException('Grupo não encontrado');
    }

    const {
      row,
      membership,
      podeGerenciar,
      membros,
      pendentes,
      qtdItensVisiveis,
    } = result.value;

    let donoNome = '';
    const dono = await this.getUserUseCase.execute({
      COD_USER_ID: row.grupo.grupoDono,
    });
    if (dono.isRight()) donoNome = dono.value.user.userNome;

    return {
      grupo: {
        ...GrupoOverviewPresenter.toHTTP({
          ...row,
          membership,
          podeGerenciar,
          qtdItensVisiveis,
        }),
        donoNome,
      },
      membros: membros.map(GrupoMembroPresenter.toHTTP),
      pendentes: pendentes.map(GrupoMembroPresenter.toHTTP),
    };
  }
}
