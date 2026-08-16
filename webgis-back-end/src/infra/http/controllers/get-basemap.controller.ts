import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { Public } from '@/infra/auth/public';
import { GetBasemapUseCase } from '@/domain/basemaps/application/use-cases/get-basemap';
import { BasemapPresenter } from '../presenters/basemap-presenter';

@Controller('/get-basemap')
export class GetBasemapController {
  constructor(private getBasemapUseCase: GetBasemapUseCase) {}

  @Get(':id')
  @Public()
  async handle(@Param('id') id: string) {
    const result = await this.getBasemapUseCase.execute({
      COD_BASEMAP_ID: id,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Basemap não encontrado');
    }

    return {
      basemap: BasemapPresenter.toHTTP(result.value.basemap),
    };
  }
}
