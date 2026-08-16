import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { FetchGrupoUseCase } from '@/domain/manager/application/use-cases/fetch-grupo';
import { GrupoPresenter } from '../presenters/grupo-presenter';
import { Public } from '@/infra/auth/public';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';
import { GetTemaUseCase } from '@/domain/manager/application/use-cases/get-tema';

@Controller('/fetch-grupo')
export class FetchGrupoController {
  constructor(
    private fetchGrupo: FetchGrupoUseCase,
    private getUsuario: GetUserUseCase,
    private getTemaUseCase: GetTemaUseCase,
  ) {}

  @Get()
  @Public()
  async handle(@Param('grupoCamadaId') COD_GRUPO_ID: string) {
    const result = await this.fetchGrupo.execute({
      COD_GRUPO_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const grupoCamadas = result.value.grupo;

    const enrichGrupo = await Promise.all(
      grupoCamadas.map((grupoCamadas) => this.enrichTema(grupoCamadas)),
    );

    return { grupos: enrichGrupo };
  }

  private async enrichTema(grupoCamada: any): Promise<any> {
    const usrCriacao = await this.getUser(grupoCamada.grupoUsuarioCriacao);

    const usrAlteracao = await this.getUser(grupoCamada.grupoUsuarioAlteracao);

    const temaNome = await this.getTemaNome(grupoCamada.grupoTema);

    return {
      ...GrupoPresenter.toHTTP(grupoCamada),
      temaNome: temaNome,
      nomeUsrCriacao: usrCriacao,
      nomeUsrAlteracao: usrAlteracao,
    };
  }

  private async getUser(codUser: string): Promise<string> {
    const result = await this.getUsuario.execute({ COD_USER_ID: codUser });

    return result?.value?.user.userNome ?? '';
  }

  private async getTemaNome(codTema: string): Promise<string> {
    const result = await this.getTemaUseCase.execute({ COD_TEMA_ID: codTema });

    return result?.value?.tema.temaNome ?? '';
  }
}
