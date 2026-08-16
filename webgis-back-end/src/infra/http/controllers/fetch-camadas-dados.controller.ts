import { GetMapaNomeUseCase } from '@/domain/mapas/application/use-cases/get-mapa-nome';
import { Public } from '@/infra/auth/public';
import { GeoserverOGC } from '@/infra/modulos_ext/geoserver/geoserver-ogc';
import {
  Controller,
  Post,
  HttpCode,
  Req,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

@Controller('/fetch-camadas-dados')
export class DadosCamadaController {
  constructor(
    private readonly geoserverOGC: GeoserverOGC,
    private getMapaNomeUseCase: GetMapaNomeUseCase,
  ) {}

  @Post()
  @Public()
  @HttpCode(201)
  async handle(@Req() request: Request, @Body() body) {
    const { tipoConteudo, nomeCamada, atributos, tipoFiltro, criterio } = body;

    // Suporta requisições diretas com uma ou mais camadas no corpo
    const layerNames = Array.isArray(nomeCamada) ? nomeCamada : [nomeCamada];
    const data = await this.geoserverOGC.getWFSLayersData(
      layerNames,
      atributos,
      tipoFiltro,
      criterio,
    );

    if (data.length > 0) {
      return data;
    } else {
      throw new HttpException(
        'Nenhum dado retornado para as camadas especificadas.',
        HttpStatus.NO_CONTENT,
      );
    }
  }
}
