import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ComponentePresenter } from '../presenters/componente-presenter';
import { Public } from '@/infra/auth/public';
import { GetComponenteUseCase } from '@/domain/manager/application/use-cases/get-componente';

@Controller('/get-componente')
export class GetComponenteController {
  constructor(private getComponenteUseCase: GetComponenteUseCase) {}

  @Get(':id')
  @Public()
  async handle(@Param('id') id: string) {
    const result = await this.getComponenteUseCase.execute({
      COD_COMPONENTE_ID: id,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Componente não encontrado');
    }

    return { componente: ComponentePresenter.toHTTP(result.value.componente) };
  }
}
