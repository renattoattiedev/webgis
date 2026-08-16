import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ComponentePresenter } from '../presenters/componente-presenter';
import { Public } from '@/infra/auth/public';
import { GetComponenteByNomeUseCase } from '@/domain/manager/application/use-cases/get-componente-nome';

@Controller('/get-componente-nome')
export class GetComponenteByNomeController {
  constructor(private getComponenteByNomeUseCase: GetComponenteByNomeUseCase) {}

  @Get()
  @Public()
  async handle(@Query('nome') nome: string) {
    if (!nome) {
      throw new BadRequestException('Nome do componente é obrigatório');
    }

    const result = await this.getComponenteByNomeUseCase.execute({
      NOM_NOME_COMPONENTE: nome,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Componente não encontrado');
    }

    return { componente: ComponentePresenter.toHTTP(result.value.componente) };
  }
}
