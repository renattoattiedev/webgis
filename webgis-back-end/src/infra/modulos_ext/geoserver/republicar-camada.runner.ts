import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { ColunasTabelaProvider } from '@/domain/camadas/application/repositories/colunas-tabela-provider';
import { GeoserverCamadaGateway } from '@/domain/camadas/application/repositories/geoserver-camada-gateway';
import { PublicacaoHistoricoRepository } from '@/domain/camadas/application/repositories/publicacao-historico-repository';
import { ReconciliarAtributosService } from '@/domain/camadas/application/services/reconciliar-atributos.service';

/**
 * Faz o trabalho pesado da republicação vetorial (GeoServer + reconciliação
 * de atributos) fora do ciclo de vida da requisição HTTP. `RepublicarCamadaUseCase`
 * já validou permissões e persistiu os metadados com status 'publishing'
 * antes deste método rodar — se algo falhar aqui, a camada fica com
 * DSC_STATUS 'error' e o usuário pode tentar de novo, igual ao raster.
 */
@Injectable()
export class RepublicarCamadaRunner {
  constructor(
    private camadasRepository: CamadasRepository,
    private colunasTabelaProvider: ColunasTabelaProvider,
    private geoserver: GeoserverCamadaGateway,
    private reconciliarAtributos: ReconciliarAtributosService,
    private historico: PublicacaoHistoricoRepository,
  ) {}

  async republicar(camadaId: string, requesterId: string): Promise<void> {
    const camada = await this.camadasRepository.findById(camadaId);
    if (!camada) return;

    const boundingBoxAnterior = camada.camadaBoundingBox;

    try {
      const pacoteConceitualNome =
        await this.geoserver.obterNomePacoteConceitual(
          camada.camadaPacotesConceituais,
        );

      const colunas = await this.colunasTabelaProvider.listarColunas(
        camada.camadaPacotesConceituais,
        camada.camadaNome,
      );

      await this.geoserver.atualizarCamada(
        camada.camadaNome,
        pacoteConceitualNome,
      );
      await this.geoserver.truncarCache(camada.camadaNome);

      const boundingBox = await this.geoserver.obterBoundingBox(
        pacoteConceitualNome,
        camada.camadaNome,
      );
      if (boundingBox) {
        camada.setCamadaBoundingBox(JSON.stringify(boundingBox));
      }

      camada.setCamadaStatus('published');
      camada.setCamadaErrorMsg(null);
      await this.camadasRepository.save(camada);

      const resumo = await this.reconciliarAtributos.execute({
        COD_CAMADA_ID: camadaId,
        colunas,
        COD_USUARIO: requesterId,
      });

      await this.historico.registrar({
        tipo: 'camada',
        camadaId,
        operacao: 'sobrescrita',
        status: 'sucesso',
        usuarioId: requesterId,
        mudancas: {
          ...resumo,
          boundingBoxAnterior,
          boundingBoxNovo: camada.camadaBoundingBox,
        },
      });
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido';

      camada.setCamadaStatus('error');
      camada.setCamadaErrorMsg(mensagem);
      await this.camadasRepository.save(camada);

      await this.historico.registrar({
        tipo: 'camada',
        camadaId,
        operacao: 'sobrescrita',
        status: 'erro',
        usuarioId: requesterId,
        errorMsg: mensagem,
      });
    }
  }
}
