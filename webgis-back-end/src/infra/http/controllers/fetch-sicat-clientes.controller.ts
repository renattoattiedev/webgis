import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FetchSicatClientesUseCase } from '@/domain/sicat/application/use-cases/fetch-sicat-clientes';
import { Public } from '@/infra/auth/public';
import { SicatClientePresenter } from '../presenters/sicat-cliente-presenter';

@Controller('/fetch-sicat-clientes')
export class FetchSicatClientesController {
  constructor(private fetchClientes: FetchSicatClientesUseCase) {}

  @Get()
  @Public()
  async handle() {
    try {
      const result = await this.fetchClientes.execute({});

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const clientes = result.value.clientes;
      return { clientes: clientes.map(SicatClientePresenter.toHTTP) };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os clientes.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
