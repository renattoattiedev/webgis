import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FetchSicatBairrosUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-bairro';
import { Public } from '@/infra/auth/public';
import { SicatBairroPresenter } from '../presenters/sicat-bairro-presenter';

@Controller('/fetch-sicat-bairros')
export class FetchSicatBairrosController {
  constructor(private fetchBairros: FetchSicatBairrosUseCase) {}

  @Get()
  @Public()
  async handle(@Query('codigoCidade') cd_cidade?: string) {
    if (!cd_cidade) {
      throw new BadRequestException('O parâmetro cd_cidade é obrigatório.');
    }

    // Permitir múltiplos ids separados por vírgula
    const cidades = cd_cidade.split(',').map((id) => {
      const num = Number(id.trim());
      if (isNaN(num)) {
        throw new BadRequestException(
          'Todos os valores de cd_cidade devem ser números.',
        );
      }
      return num;
    });

    try {
      const result = await this.fetchBairros.execute({
        cd_cidades: cidades,
      });

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const bairros = result.value.bairros;
      return { bairros: bairros.map(SicatBairroPresenter.toHTTP) };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os bairros.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
