import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FetchSicatImoveisUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-imoveis';
import { Public } from '@/infra/auth/public';
import { SicatImovelPresenter } from '../presenters/sicat-imovel-presenter';

@Controller('/fetch-sicat-imoveis')
export class FetchSicatImoveisController {
  constructor(private fetchImoveis: FetchSicatImoveisUseCase) {}

  @Get()
  @Public()
  async handle() {
    try {
      const result = await this.fetchImoveis.execute({});

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const imoveis = result.value.imoveis;
      return { imoveis: imoveis.map(SicatImovelPresenter.toHTTP) };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os imóveis.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
