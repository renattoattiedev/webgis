import { BadRequestException, Controller, Get, Param } from '@nestjs/common';

import { FetchComponentesUseCase } from '@/domain/manager/application/use-cases/fetch-componentes';
import { ComponentePresenter } from '../presenters/componente-presenter';
import { Public } from '@/infra/auth/public';

@Controller('/fetch-componentes')
export class FetchComponentesController {
  constructor(private fetchComponentes: FetchComponentesUseCase) {}

  @Get()
  @Public()
  async handle(@Param('componenteId') COD_COMPONENTE_ID: string) {
    const result = await this.fetchComponentes.execute({
      COD_COMPONENTE_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const componentes = result.value.componentes;

    return { componentes: componentes.map(ComponentePresenter.toHTTP) };
  }
}
