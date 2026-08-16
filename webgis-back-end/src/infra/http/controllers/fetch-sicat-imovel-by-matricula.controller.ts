import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { FetchSicatImovelByMatriculaUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-imovel-by-matricula';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { SicatImovelMatriculaDetalhadaPresenter } from '../presenters/sicat-imovel-matricula-detalhada-presenter';

@Controller('/fetch-sicat-imovel')
export class FetchSicatImovelByMatriculaController {
  constructor(
    private fetchSicatImovelByMatricula: FetchSicatImovelByMatriculaUseCase,
  ) {}

  @Get(':matricula_imovel')
  async handle(@Param('matricula_imovel') matriculaParam: string) {
    try {
      const matricula = Number(String(matriculaParam).trim());

      if (!Number.isFinite(matricula) || matricula <= 0) {
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          error: 'Parâmetro "matricula_imovel" inválido. Deve ser numérico.',
          matricula_imovel: matriculaParam,
        });
      }

      console.log(`🔍 Buscando imóvel detalhado por matrícula: ${matricula}`);

      const result = await this.fetchSicatImovelByMatricula.execute({
        matricula_imovel: matricula,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof ResourceNotFoundError) {
          console.warn(
            `⚠️ Imóvel não encontrado para a matrícula ${matricula}`,
          );
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              error: `Imóvel não encontrado para a matrícula ${matricula}.`,
              matricula_imovel: matricula,
            },
            HttpStatus.NOT_FOUND,
          );
        }

        throw new BadRequestException();
      }

      // Aceita a chave do use-case como "imovel" (atual) ou "imovelDetalhado" (compatibilidade)
      const imovelDetalhado =
        // @ts-expect-error compat entre nomes de propriedades
        result.value.imovelDetalhado ?? result.value.imovel;

      console.log(
        `✅ Imóvel encontrado para a matrícula: ${matricula} - Matrícula: ${imovelDetalhado?.matricula_imovel}`,
      );

      return {
        imovelDetalhado:
          SicatImovelMatriculaDetalhadaPresenter.toHTTP(imovelDetalhado),
        success: true,
        message: `Imóvel encontrado para a matrícula ${matricula}`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `❌ Erro ao buscar imóvel por matrícula ${matriculaParam}:`,
        error,
      );

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro interno ao buscar o imóvel pela matrícula.',
          matricula_imovel: matriculaParam,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
