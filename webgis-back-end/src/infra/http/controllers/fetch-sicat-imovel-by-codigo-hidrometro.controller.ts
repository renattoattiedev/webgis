import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { FetchSicatImovelByCodigoHidrometroUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-imovel-by-codigo-hidrometro';
import { SicatImovelHidrometroDetalhadoPresenter } from '../presenters/sicat-imovel-hidrometro-detalhado-presenter';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

@Controller('/fetch-sicat-imovel-by-hidrometro')
export class FetchSicatImovelByCodigoHidrometroController {
  constructor(
    private fetchSicatImovelByCodigoHidrometro: FetchSicatImovelByCodigoHidrometroUseCase,
  ) {}

  @Get(':codigo_hidrometro')
  async handle(@Param('codigo_hidrometro') codigo_hidrometro: string) {
    try {
      console.log(
        `🔍 Buscando imóvel detalhado por código do hidrômetro: ${codigo_hidrometro}`,
      );

      const result = await this.fetchSicatImovelByCodigoHidrometro.execute({
        codigo_hidrometro: codigo_hidrometro.trim(),
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof ResourceNotFoundError) {
          console.warn(
            `⚠️ Imóvel não encontrado para o hidrômetro ${codigo_hidrometro}`,
          );
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              error: `Imóvel não encontrado para o hidrômetro ${codigo_hidrometro}.`,
              codigo_hidrometro: codigo_hidrometro,
            },
            HttpStatus.NOT_FOUND,
          );
        }

        throw new BadRequestException();
      }

      const imovelDetalhado = result.value.imovelDetalhado;

      console.log(
        `✅ Imóvel encontrado para o hidrômetro: ${codigo_hidrometro} - Matrícula: ${imovelDetalhado.matricula_imovel}`,
      );

      return {
        imovelDetalhado:
          SicatImovelHidrometroDetalhadoPresenter.toHTTP(imovelDetalhado),
        success: true,
        message: `Imóvel encontrado para o hidrômetro ${codigo_hidrometro}`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `❌ Erro ao buscar imóvel por hidrômetro ${codigo_hidrometro}:`,
        error,
      );

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error:
            'Ocorreu um erro interno ao buscar o imóvel pelo código do hidrômetro.',
          codigo_hidrometro: codigo_hidrometro,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
