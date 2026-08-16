import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { GetSicatClienteByIdUseCase } from '@/domain/sicat/application/use-cases/get-sicat-cliente-by-id';
import { Public } from '@/infra/auth/public';
import { SicatClientePresenter } from '../presenters/sicat-cliente-presenter';

@Controller('/get-sicat-cliente')
export class GetSicatClienteByIdController {
  constructor(private GetClienteById: GetSicatClienteByIdUseCase) {}

  @Get('/:cd_cliente')
  @Public()
  async handle(@Param('cd_cliente', ParseIntPipe) cd_cliente: number) {
    try {
      const result = await this.GetClienteById.execute({
        cd_cliente,
      });

      if (result.isLeft()) {
        throw new NotFoundException('Cliente não encontrado');
      }

      const cliente = result.value.cliente;
      return { cliente: SicatClientePresenter.toHTTP(cliente) };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar o cliente.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
