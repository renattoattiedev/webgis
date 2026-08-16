import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { FetchSolicitacaoServicosByNumSsUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos-by-numss';
import { SolicitacaoServicosByNumSsPresenter } from '../presenters/solicitacao-servicos-by-numss-presenter';

@Controller('/fetch-solicitacao-servicos-by-numss')
export class FetchSolicitacaoServicosByNumSsController {
  constructor(
    private fetchSolicitacaoServicosByNumSs: FetchSolicitacaoServicosByNumSsUseCase,
  ) {}

  @Get(':numSs')
  async handle(@Param('numSs') numSs: string) {
    try {
      console.log(
        `🔍 Buscando solicitações de serviços para SS número: ${numSs}`,
      );

      const result = await this.fetchSolicitacaoServicosByNumSs.execute({
        numSs,
      });

      const seqSs = result.seqSs;

      if (!seqSs || seqSs.length === 0) {
        console.warn(
          `⚠️ Nenhuma sequência de SS encontrada para num_ss ${numSs}`,
        );
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `Nenhuma sequência de SS encontrada para num_ss ${numSs}.`,
            numSs,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      console.log(
        `✅ ${seqSs.length} sequência(s) de SS encontrada(s) para num_ss: ${numSs}`,
      );

      return {
        seqSs: seqSs.map(SolicitacaoServicosByNumSsPresenter.toHTTP),
        success: true,
        message: `${seqSs.length} sequência(s) de SS encontrada(s) para num_ss ${numSs}`,
        total: seqSs.length,
        numSs,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error(
        `❌ Erro ao buscar sequências de SS para num_ss ${numSs}:`,
        error,
      );

      throw new BadRequestException(
        'Não foi possível buscar as sequências de SS para o número informado.',
      );
    }
  }
}
