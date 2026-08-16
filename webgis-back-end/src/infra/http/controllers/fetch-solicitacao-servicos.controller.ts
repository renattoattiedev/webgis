import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FetchSolicitacaoServicosUseCase } from '@/domain/sicat/application/use-cases/fetch-solicitacao-servicos';
import { SolicitacaoServicosPresenter } from '../presenters/solicitacao-servicos-presenter';

@Controller('/fetch-solicitacao-servicos')
export class FetchSolicitacaoServicosController {
  constructor(
    private fetchSolicitacaoServicos: FetchSolicitacaoServicosUseCase,
  ) {}

  @Get()
  async handle() {
    try {
      console.log('🔍 Buscando todas as solicitações de serviços');

      const result = await this.fetchSolicitacaoServicos.execute();

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const solicitacoes = result.value.solicitacoes;

      console.log(
        `✅ ${solicitacoes.length} solicitação(ões) de serviços encontrada(s)`,
      );

      return {
        solicitacoes: solicitacoes.map(SolicitacaoServicosPresenter.toHTTP),
        success: true,
        message: `${solicitacoes.length} solicitação(ões) de serviços encontrada(s)`,
        total: solicitacoes.length,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar solicitações de serviços:', error);

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar as solicitações de serviços.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
