import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FetchSicatHidrometrosByMatriculaUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-hidrometros-by-matricula';
import { SicatHidrometroImovelPresenter } from '../presenters/sicat-hidrometro-imovel-presenter';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

@Controller('/fetch-sicat-hidrometros')
export class FetchSicatHidrometrosByMatriculaController {
  constructor(
    private fetchSicatHidrometrosByMatricula: FetchSicatHidrometrosByMatriculaUseCase,
  ) {}

  @Get(':matricula_imovel')
  async handle(
    @Param('matricula_imovel', ParseIntPipe) matricula_imovel: number,
  ) {
    try {
      console.log(
        `🔍 Buscando hidrômetros para imóvel com matrícula: ${matricula_imovel}`,
      );

      const result = await this.fetchSicatHidrometrosByMatricula.execute({
        matricula_imovel,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof ResourceNotFoundError) {
          console.warn(
            `⚠️ Nenhum hidrômetro encontrado para o imóvel com matrícula ${matricula_imovel}`,
          );
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              error: `Nenhum hidrômetro encontrado para o imóvel com matrícula ${matricula_imovel}.`,
              matricula_imovel: matricula_imovel,
            },
            HttpStatus.NOT_FOUND,
          );
        }

        throw new BadRequestException();
      }

      const hidrometros = result.value.hidrometros;

      console.log(
        `✅ ${hidrometros.length} hidrômetro(s) encontrado(s) para a matrícula: ${matricula_imovel}`,
      );

      return {
        hidrometros: hidrometros.map(SicatHidrometroImovelPresenter.toHTTP),
        success: true,
        message: `${hidrometros.length} hidrômetro(s) encontrado(s) para o imóvel com matrícula ${matricula_imovel}`,
        total: hidrometros.length,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `❌ Erro ao buscar hidrômetros para imóvel com matrícula ${matricula_imovel}:`,
        error,
      );

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro interno ao buscar os hidrômetros do imóvel.',
          matricula_imovel: matricula_imovel,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
