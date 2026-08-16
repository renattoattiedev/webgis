import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FetchSicatHidrometrosImoveisUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-hidrometros-imoveis';
import { SicatHidrometroImovelPresenter } from '../presenters/sicat-hidrometro-imovel-presenter';

@Controller('/fetch-sicat-hidrometros-imoveis')
export class FetchSicatHidrometrosImoveisController {
  constructor(
    private fetchHidrometrosImoveis: FetchSicatHidrometrosImoveisUseCase,
  ) {}

  @Get()
  async handle() {
    try {
      const result = await this.fetchHidrometrosImoveis.execute();

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const hidrometros = result.value.hidrometros;
      return {
        hidrometros: hidrometros.map(SicatHidrometroImovelPresenter.toHTTP),
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os hidrômetros dos imóveis.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
