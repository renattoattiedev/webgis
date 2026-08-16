import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { FetchBasemapsUseCase } from '@/domain/basemaps/application/use-cases/fetch-basemaps';
import { BasemapPresenter } from '../presenters/basemap-presenter';
import { Public } from '@/infra/auth/public';

@Controller('/fetch-basemaps')
export class FetchBasemapsController {
  constructor(private fetchBasemapsUseCase: FetchBasemapsUseCase) {}

  @Get()
  @Public()
  async handle(@Param('basemapId') COD_BASEMAP_ID?: string) {
    const result = await this.fetchBasemapsUseCase.execute({
      COD_BASEMAP_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException();
    }

    const basemaps = result.value.basemaps;

    return { basemaps: basemaps.map(BasemapPresenter.toHTTP) };
  }
}
