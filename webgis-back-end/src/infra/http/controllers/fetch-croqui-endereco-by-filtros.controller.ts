import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { FetchCroquiEnderecoByFiltrosUseCase } from '@/domain/croqui/application/use-cases/fetch-croqui-endereco-by-filtros';
import { Public } from '@/infra/auth/public';
import { CroquiEnderecoPresenter } from '../presenters/croqui-endereco-presenter';

@Controller('/fetch-croqui-endereco-filtros')
export class FetchCroquiEnderecoByFiltrosController {
  constructor(
    private fetchCroquiEnderecoByFiltros: FetchCroquiEnderecoByFiltrosUseCase,
  ) {}

  @Get()
  @Public()
  async handle(
    @Query('cd_cidade') cd_cidade?: string,
    @Query('cd_bairro') cd_bairro?: string,
    @Query('cd_logradouro') cd_logradouro?: string,
  ) {
    try {
      const result = await this.fetchCroquiEnderecoByFiltros.execute({
        cd_cidade: cd_cidade ? parseInt(cd_cidade, 10) : undefined,
        cd_bairro: cd_bairro ? parseInt(cd_bairro, 10) : undefined,
        cd_logradouro: cd_logradouro ? parseInt(cd_logradouro, 10) : undefined,
      });

      if (result.isLeft()) {
        throw new BadRequestException();
      }

      const croquisEndereco = result.value.croquisEndereco;
      return {
        enderecos: croquisEndereco.map(CroquiEnderecoPresenter.toHTTP),
        total: croquisEndereco.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao buscar os endereços.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
