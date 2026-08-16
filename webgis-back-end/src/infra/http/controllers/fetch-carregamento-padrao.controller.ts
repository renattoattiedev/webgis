import { Controller, Get, BadRequestException } from '@nestjs/common';
import { FetchCarregamentoPadraoUseCase } from '@/domain/manager/application/use-cases/fetch-carregamento-padrao';
import { CarregamentoPadraoPresenter } from '../presenters/carregamento-padrao-presenter';
import { Public } from '@/infra/auth/public';

@Controller('/fetch-carregamento-padrao')
export class FetchCarregamentoPadraoController {
  constructor(
    private fetchCarregamentoPadraoUseCase: FetchCarregamentoPadraoUseCase,
  ) {}

  @Get()
  @Public()
  async handle() {
    const result = await this.fetchCarregamentoPadraoUseCase.executeMany();

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar carregamento padrão');
    }

    return {
      conteudo: CarregamentoPadraoPresenter.manyToHTTP(result.value.conteudo),
      total: result.value.conteudo.length,
    };
  }
}
