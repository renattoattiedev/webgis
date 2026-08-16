import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { GetSicatImovelByMatriculaUseCase } from '@/domain/sicat/application/use-cases/get-sicat-imovel-by-matricula';
import { Public } from '@/infra/auth/public';
import { SicatImovelMatriculaDetalhadaPresenter } from '../presenters/sicat-imovel-matricula-detalhada-presenter';

@Controller('/get-sicat-imovel')
export class GetSicatImovelByMatriculaController {
  constructor(private GetImovelByMatricula: GetSicatImovelByMatriculaUseCase) {}

  @Get('/:matricula_imovel')
  @Public()
  async handle(
    @Param('matricula_imovel', ParseIntPipe) matricula_imovel: number,
  ) {
    try {
      const result = await this.GetImovelByMatricula.execute({
        matricula_imovel,
      });

      if (result.isLeft()) {
        throw new NotFoundException('Imóvel não encontrado');
      }

      const imovel = result.value.imovel;
      return { imovel: SicatImovelMatriculaDetalhadaPresenter.toHTTP(imovel) };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar o imóvel.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
