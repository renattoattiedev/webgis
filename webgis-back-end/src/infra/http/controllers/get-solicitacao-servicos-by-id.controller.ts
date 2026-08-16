import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { GetSolicitacaoServicosByIdUseCase } from '@/domain/sicat/application/use-cases/get-solicitacao-servicos-by-id';
import { Public } from '@/infra/auth/public';
import { SolicitacaoServicosPresenter } from '../presenters/solicitacao-servicos-presenter';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

@Controller('/get-solicitacao-servicos')
export class GetSolicitacaoServicosByIdController {
  constructor(
    private getSolicitacaoServicosById: GetSolicitacaoServicosByIdUseCase,
  ) {}

  @Get(':numSs/:seqSs')
  async handle(
    @Param('numSs') numSs: string,
    @Param('seqSs', ParseIntPipe) seqSs: number,
  ) {
    try {
      console.log(
        `🔍 Buscando solicitação de serviços com ID: ${numSs}-${seqSs}`,
      );

      const result = await this.getSolicitacaoServicosById.execute({
        numSs,
        seqSs,
      });

      if (result.isLeft()) {
        const error = result.value;

        if (error instanceof ResourceNotFoundError) {
          console.warn(
            `⚠️ Solicitação de serviços não encontrada com ID ${numSs}-${seqSs}`,
          );
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              error: `Solicitação de serviços não encontrada com ID ${numSs}-${seqSs}.`,
              numSs: numSs,
              seqSs: seqSs,
            },
            HttpStatus.NOT_FOUND,
          );
        }

        throw new BadRequestException();
      }

      const solicitacao = result.value.solicitacao;

      console.log(
        `✅ Solicitação de serviços encontrada com ID: ${numSs}-${seqSs}`,
      );

      return {
        solicitacao: SolicitacaoServicosPresenter.toHTTP(solicitacao),
        success: true,
        message: `Solicitação de serviços encontrada com ID ${numSs}-${seqSs}`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `❌ Erro ao buscar solicitação de serviços com ID ${numSs}-${seqSs}:`,
        error,
      );

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro interno ao buscar a solicitação de serviços.',
          numSs: numSs,
          seqSs: seqSs,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
