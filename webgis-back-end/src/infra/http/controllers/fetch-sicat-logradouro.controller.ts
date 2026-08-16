import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FetchSicatLogradourosUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-logradouro';
import { Public } from '@/infra/auth/public';
import { SicatLogradourosPresenter } from '../presenters/sicat-logradouros-presenter';

@Controller('/fetch-sicat-logradouros')
export class FetchSicatLogradourosController {
  constructor(private fetchLogradouros: FetchSicatLogradourosUseCase) {}

  @Get()
  @Public()
  async handle(@Query('codigoCidade') cd_cidade?: string) {
    if (!cd_cidade) {
      throw new BadRequestException('É obrigatório informar cd_cidade');
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
      const result = await this.fetchLogradouros.execute({
        cd_cidades: cidades,
      });

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const logradouros = result.value.logradouros;

      if (!logradouros || logradouros.length === 0) {
        throw new BadRequestException(
          'Nenhum logradouro encontrado para a(s) cidade(s) informada(s).',
        );
      }

      return { logradouros: logradouros.map(SicatLogradourosPresenter.toHTTP) };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os logradouros.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
