import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { FetchAtributosCamadasUseCase } from '@/domain/camadas/application/use-cases/fetch-atributos-camadas';
import { AtributosPresenter } from '../presenters/atributos-presenter';
import { Public } from '@/infra/auth/public';

@Controller('/fetch-atributos-camadas/:camadaId')
export class FetchAtributosCamadasController {
  constructor(private fetchAtributos: FetchAtributosCamadasUseCase) {}

  @Get()
  @Public()
  async handle(@Param('camadaId') COD_CAMADA_ID: string) {
    const result = await this.fetchAtributos.execute({
      COD_CAMADA_ID,
      manager: false,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Erro ao buscar camadas do grupo');
    }

    const atributos = result.value.atributos;

    return {
      atributos: atributos.map(AtributosPresenter.toHTTP),
    };
  }
}
