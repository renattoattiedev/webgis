import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common';
import { FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos-detalhada-by-ref-atendimento';
import { SolicitacaoServicosDetalhadaPresenter } from '../presenters/solicitacao-servicos-detalhada-presenter';
import { Public } from '@/infra/auth/public';

@Controller('/fetch-solicitacao-servicos-detalhada')
export class FetchSolicitacaoServicosDetalhadaByRefAtendimentoController {
  constructor(
    private fetchSolicitacaoServicosDetalhadaByRefAtendimento: FetchSolicitacaoServicosDetalhadaByRefAtendimentoUseCase,
  ) {}
  @Post()
  @Public()
  @HttpCode(200)
  async handle(@Body() body: { numSs: string; seqSs: string | number }) {
    const { numSs, seqSs } = body;

    console.log(
      `🔍 Buscando solicitações de serviços detalhadas para ref_atendimento: ${numSs}, seq_ss: ${seqSs}`,
    );

    if (!numSs || !seqSs) {
      throw new BadRequestException(
        'Referência de atendimento e sequência de solicitação devem ser números válidos',
      );
    }

    const result =
      await this.fetchSolicitacaoServicosDetalhadaByRefAtendimento.execute({
        numSs,
        seqSs: Number(seqSs),
      });

    return {
      solicitacoes: result.solicitacoes.map(
        SolicitacaoServicosDetalhadaPresenter.toHTTP,
      ),
      success: true,
      message: `${result.solicitacoes.length} solicitação(ões) de serviços encontrada(s) para ref_atendimento ${numSs} e seq_ss ${seqSs}`,
    };
  }
}
