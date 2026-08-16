import { BadRequestException, Controller, Get, Param } from '@nestjs/common';

import { FetchTemasUseCase } from '@/domain/manager/application/use-cases/fetch-temas';
import { TemasPresenter } from '../presenters/temas-presenter';
import { Public } from '@/infra/auth/public';
import { GetUserUseCase } from '@/domain/security/application/use-cases/get-user';

@Controller('/fetch-temas')
export class FetchTemasController {
  constructor(
    private fetchTemas: FetchTemasUseCase,
    private getUsuario: GetUserUseCase,
  ) {}

  @Get()
  @Public()
  async handle(@Param('temaId') COD_TEMA_ID: string) {
    const result = await this.fetchTemas.execute({
      COD_TEMA_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const temas = result.value.temas;

    const enrichTema = await Promise.all(
      temas.map((temas) => this.enrichTema(temas)),
    );

    return { temas: enrichTema };
  }

  private async enrichTema(tema: any): Promise<any> {
    const usrCriacao = await this.getUser(tema.temaUsuarioCriacao);

    const usrAlteracao = await this.getUser(tema.temaUsuarioAlteracao);

    return {
      ...TemasPresenter.toHTTP(tema),
      nomeUsrCriacao: usrCriacao,
      nomeUsrAlteracao: usrAlteracao,
    };
  }

  private async getUser(codUser: string): Promise<string> {
    const result = await this.getUsuario.execute({ COD_USER_ID: codUser });

    return result?.value?.user.userNome ?? '';
  }
}
