import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { FetchNivelCompartilhamentoUseCase } from '@/domain/manager/application/use-cases/fetch-nivel-compartilhamento';
import { NivelCompartilhamentoPresenter } from '../presenters/nivel-compartilhamento-presenter';
import { Public } from '@/infra/auth/public';

@Controller('/fetch-nivel-compartilhamento')
export class FetchNivelCompartilhamentoController {
  constructor(
    private fetchNivelCompartilhamento: FetchNivelCompartilhamentoUseCase,
  ) {}

  @Get()
  @Public()
  async handle(
    @Param('nivelCompartilhamentoId') COD_NIVEL_COMPATILHAMENTO: string,
  ) {
    const result = await this.fetchNivelCompartilhamento.executeMany({
      COD_NIVEL_COMPATILHAMENTO,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const nivelCompartilhamento = result.value.nivelCompartilhamentoMany;

    return {
      nivelCompartilhamento: nivelCompartilhamento.map(
        NivelCompartilhamentoPresenter.toHTTP,
      ),
    };
  }
}
