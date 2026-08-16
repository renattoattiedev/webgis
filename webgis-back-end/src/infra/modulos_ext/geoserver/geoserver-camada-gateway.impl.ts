import { BadRequestException, Injectable } from '@nestjs/common';
import { GeoserverCamadaGateway } from '@/domain/camadas/application/repositories/geoserver-camada-gateway';
import { GeoserverAPI } from './geoserver-api';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';

@Injectable()
export class GeoserverCamadaGatewayImpl implements GeoserverCamadaGateway {
  constructor(
    private geoserverAPI: GeoserverAPI,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
  ) {}

  async atualizarCamada(
    nomeCamada: string,
    pacoteConceitualNome: string,
  ): Promise<void> {
    await this.geoserverAPI.atualizarCamada(nomeCamada, pacoteConceitualNome);
  }

  async truncarCache(nomeCamada: string): Promise<void> {
    await this.geoserverAPI.truncarCache(nomeCamada);
  }

  async obterBoundingBox(
    pacoteConceitualNome: string,
    nomeCamada: string,
  ): Promise<unknown | null> {
    return this.geoserverAPI.getBoundingBox(pacoteConceitualNome, nomeCamada);
  }

  async obterNomePacoteConceitual(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<string> {
    const result = await this.fetchPacotesConceituais.execute({
      COD_PACOTE_CONCEITUAL_ID,
    });

    if (result.isLeft()) {
      throw new BadRequestException('Pacote conceitual não encontrado');
    }

    return result.value.pacotesConceituais.pacoteConceitualNome;
  }
}
