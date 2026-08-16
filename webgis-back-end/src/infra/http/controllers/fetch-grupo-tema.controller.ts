import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { FetchGrupoTemasUseCase } from '@/domain/manager/application/use-cases/fetch-grupo-tema';
import { GruposTemaPresenter } from '../presenters/grupo-tema-presenter';
import { Public } from '@/infra/auth/public';

@Controller('/fetch-grupo/:grupoTemaId')
export class FetchGrupoTemaController {
  constructor(private fetchGrupoTema: FetchGrupoTemasUseCase) {}

  @Get()
  @Public()
  async handle(@Param('grupoTemaId') COD_TEMA_ID: string) {
    const result = await this.fetchGrupoTema.execute({
      COD_TEMA_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const grupoCamadasTema = result.value.grupoTema;

    return {
      gruposTema: grupoCamadasTema.map(GruposTemaPresenter.toHTTP),
    };
  }
}
