import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FetchSicatCidadesUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-cidades';
import { Public } from '@/infra/auth/public';
import { SicatCidadePresenter } from '../presenters/sicat-cidade-presenter';

@Controller('/fetch-sicat-cidades')
export class FetchSicatCidadesController {
  constructor(private fetchCidades: FetchSicatCidadesUseCase) {}

  @Get()
  @Public()
  async handle() {
    try {
      const result = await this.fetchCidades.execute({});

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const cidades = result.value.cidades;
      return { cidades: cidades.map(SicatCidadePresenter.toHTTP) };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar as cidades.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
