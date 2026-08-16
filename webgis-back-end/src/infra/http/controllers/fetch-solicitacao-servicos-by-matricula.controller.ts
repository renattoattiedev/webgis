import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { FetchSolicitacaoServicosByMatriculaUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos-by-matricula';
import { SolicitacaoServicosPresenter } from '../presenters/solicitacao-servicos-presenter';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

@Controller('/fetch-solicitacao-servicos-by-matricula')
export class FetchSolicitacaoServicosByMatriculaController {
  constructor(
    private fetchSolicitacaoServicosByMatricula: FetchSolicitacaoServicosByMatriculaUseCase,
  ) {}

  @Get(':matricula')
  async handle(@Param('matricula', ParseIntPipe) matricula: string) {
    try {
      console.log(
        `🔍 Buscando solicitações de serviços para imóvel com matrícula: ${matricula}`,
      );

      const result = await this.fetchSolicitacaoServicosByMatricula.execute({
        matricula,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof ResourceNotFoundError) {
          console.warn(
            `⚠️ Nenhuma solicitação de serviços encontrada para o imóvel com matrícula ${matricula}`,
          );
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              error: `Nenhuma solicitação de serviços encontrada para o imóvel com matrícula ${matricula}.`,
              matricula_imovel: matricula,
            },
            HttpStatus.NOT_FOUND,
          );
        }

        throw new BadRequestException();
      }

      const solicitacoes = result.value.solicitacoes;

      console.log(
        `✅ ${solicitacoes.length} solicitação(ões) de serviços encontrada(s) para a matrícula: ${matricula}`,
      );

      return {
        solicitacoes: solicitacoes.map(SolicitacaoServicosPresenter.toHTTP),
        success: true,
        message: `${solicitacoes.length} solicitação(ões) de serviços encontrada(s) para o imóvel com matrícula ${matricula}`,
        total: solicitacoes.length,
        matricula: matricula,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `❌ Erro ao buscar solicitações de serviços para imóvel com matrícula ${matricula}:`,
        error,
      );

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error:
            'Ocorreu um erro interno ao buscar as solicitações de serviços do imóvel.',
          matricula: matricula,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
