import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { GeoserverAPI } from './geoserver-api';
import { RasterPublicacaoService } from './raster-publicacao.service';
import { GwcSeedService } from './gwc-seed.service';
import { GdalCogService } from '@/infra/modulos_ext/gdal/gdal-cog.service';
import { PublicacaoHistoricoRepository } from '@/domain/camadas/application/repositories/publicacao-historico-repository';

/**
 * Refaz a publicação de um raster já existente. Espelha `publicarAsync` do
 * CreateCamadasRasterController — mesma sequência e mesmos valores de
 * DSC_STATUS, para o polling do frontend continuar funcionando — com um passo
 * a mais: remover o coveragestore antigo antes de republicar, já que o POST de
 * criação falha se o store já existir.
 *
 * O registro da camada nunca é apagado: se algo falhar, ela fica com
 * DSC_STATUS 'error' e o usuário pode tentar de novo.
 */
@Injectable()
export class RasterRepublicacaoRunner {
  constructor(
    private prisma: PrismaService,
    private geoserverClient: GeoserverAPI,
    private rasterPublicacaoService: RasterPublicacaoService,
    private gdalCogService: GdalCogService,
    private gwcSeedService: GwcSeedService,
    private historico: PublicacaoHistoricoRepository,
  ) {}

  /**
   * Grava, de forma síncrona, o status 'publishing' antes do controller
   * retornar a resposta HTTP — garante que um polling imediato do frontend
   * já veja um status "em andamento" em vez do status/erro obsoleto da
   * publicação anterior. `republicar` (chamado via setImmediate logo em
   * seguida) já transiciona para 'converting' na sequência.
   */
  async marcarPublishing(camadaId: string): Promise<void> {
    await this.prisma.camadasRaster.update({
      where: { COD_CAMADA_RASTER_ID: camadaId },
      data: {
        DSC_STATUS: 'publishing',
        DSC_ERROR_MSG: null,
      },
    });
  }

  async republicar(
    camadaId: string,
    relativePath: string,
    usuarioId: string,
  ): Promise<void> {
    const nomeFlat = relativePath
      .replace(/\.tif$/i, '')
      .replace(/[\/\\]/g, '__');

    try {
      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: {
          DSC_STATUS: 'converting',
          NUM_UPLOAD_PROGRESS: 50,
          DSC_ERROR_MSG: null,
        },
      });

      const perfilCog = await this.gdalCogService.convertToCog(
        relativePath,
        async (pct) => {
          const overall = Math.min(100, 50 + Math.floor(pct / 2));
          await this.prisma.camadasRaster.update({
            where: { COD_CAMADA_RASTER_ID: camadaId },
            data: { NUM_UPLOAD_PROGRESS: overall },
          });
        },
      );

      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: {
          DSC_STATUS: 'publishing',
          NUM_UPLOAD_PROGRESS: 100,
          DSC_COG_PERFIL: perfilCog,
        },
      });

      await this.geoserverClient.deleteCoverageStore(nomeFlat);
      await this.rasterPublicacaoService.publicar(relativePath);

      const boundingBox =
        await this.geoserverClient.getBoundingBoxRaster(nomeFlat);

      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: {
          DSC_STATUS: 'published',
          DSC_BOUNDING_BOX: boundingBox ? JSON.stringify(boundingBox) : null,
          DSC_ERROR_MSG: null,
        },
      });

      if (boundingBox) {
        await this.gwcSeedService.startSeed(nomeFlat, boundingBox);
        await this.prisma.camadasRaster.update({
          where: { COD_CAMADA_RASTER_ID: camadaId },
          data: { DSC_SEED_STATUS: 'seeding', NUM_SEED_PROGRESS: 0 },
        });
      }

      await this.historico.registrar({
        tipo: 'raster',
        camadaId,
        operacao: 'sobrescrita',
        status: 'sucesso',
        usuarioId,
      });
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Erro desconhecido';

      await this.prisma.camadasRaster.update({
        where: { COD_CAMADA_RASTER_ID: camadaId },
        data: {
          DSC_STATUS: 'error',
          DSC_ERROR_MSG: mensagem.slice(0, 500),
        },
      });

      await this.historico.registrar({
        tipo: 'raster',
        camadaId,
        operacao: 'sobrescrita',
        status: 'erro',
        usuarioId,
        errorMsg: mensagem,
      });
    }
  }
}
