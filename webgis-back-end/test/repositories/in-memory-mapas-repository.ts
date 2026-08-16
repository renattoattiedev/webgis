import { MapasRepository } from '@/domain/mapas/application/repositories/mapas-repository';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { MapasCamadas } from '@/domain/mapas/enterprise/entities/mapas-camadas';
import { MapasCamadasFiltros } from '@/domain/mapas/enterprise/entities/mapas-camadas-filtro';
import { MapasCamadasRaster } from '@/domain/mapas/enterprise/entities/mapas-camadas-raster';

export class InMemoryMapasRepository implements MapasRepository {
  itens: Mapas[] = [];
  mapasCamadas: MapasCamadas[] = [];
  mapasCamadasRaster: MapasCamadasRaster[] = [];
  mapasCamadasFiltros: MapasCamadasFiltros[] = [];

  async findById(
    COD_MAPA_ID: string,
  ): Promise<{ mapa: Mapas; camadas: Camadas[] }> {
    const mapa = this.itens.find((m) => m.id.toString() === COD_MAPA_ID);
    return { mapa: mapa as Mapas, camadas: [] };
  }

  async findByNome(NOM_NOME_MAPA: string): Promise<{
    mapa: Mapas | null;
    camadasRaster: {
      camadaRaster: CamadasRaster;
      ordemRenderizacao: number;
    }[];
    camadas: { camada: Camadas; ordemRenderizacao: number }[];
  }> {
    const mapa = this.itens.find((m) => m.mapaNome === NOM_NOME_MAPA) ?? null;
    return { mapa, camadasRaster: [], camadas: [] };
  }

  async findManyByMapas(): Promise<Mapas[]> {
    return this.itens;
  }

  async findManyByMapasUserId(COD_USUARIO_CRIACAO: string): Promise<Mapas[]> {
    return this.itens.filter(
      (m) => m.mapaUsuarioCriacao === COD_USUARIO_CRIACAO,
    );
  }

  async findManyByMapasGrupoId(COD_GRUPO_ID: string): Promise<Mapas[]> {
    return this.itens.filter((m) => m.mapaGrupo === COD_GRUPO_ID);
  }

  async getOrdemCamada(): Promise<number> {
    return 0;
  }

  async getOrdemCamadaRaster(): Promise<number> {
    return 0;
  }

  async create(mapa: Mapas): Promise<void> {
    this.itens.push(mapa);
  }

  async save(mapa: Mapas): Promise<void> {
    const idx = this.itens.findIndex(
      (m) => m.id.toString() === mapa.id.toString(),
    );
    if (idx >= 0) this.itens[idx] = mapa;
  }

  async changeOwner(): Promise<void> {
    return;
  }

  async deleteMapa(): Promise<void> {
    return;
  }

  async findCamadaMapaById(
    COD_CAMADA_ID: string,
    COD_MAPA_ID: string,
  ): Promise<MapasCamadas | null> {
    return (
      this.mapasCamadas.find(
        (mc) =>
          mc.codCamadaId === COD_CAMADA_ID && mc.codMapaId === COD_MAPA_ID,
      ) ?? null
    );
  }

  async findCamadaRasterMapaById(
    COD_CAMADA_RASTER_ID: string,
    COD_MAPA_ID: string,
  ): Promise<MapasCamadasRaster | null> {
    return (
      this.mapasCamadasRaster.find(
        (mc) =>
          mc.codCamadaId === COD_CAMADA_RASTER_ID &&
          mc.codMapaId === COD_MAPA_ID,
      ) ?? null
    );
  }

  async addCamadaToMapa(mapasCamadas: MapasCamadas): Promise<void> {
    this.mapasCamadas.push(mapasCamadas);
  }

  async addCamadaRasterToMapa(
    mapasCamadasRaster: MapasCamadasRaster,
  ): Promise<void> {
    this.mapasCamadasRaster.push(mapasCamadasRaster);
  }

  async removeCamadaFromMapa(
    COD_MAPA_ID: string,
    COD_CAMADA_ID: string,
  ): Promise<void> {
    this.mapasCamadas = this.mapasCamadas.filter(
      (mc) =>
        !(mc.codMapaId === COD_MAPA_ID && mc.codCamadaId === COD_CAMADA_ID),
    );
  }

  async removeCamadaRasterFromMapa(
    COD_MAPA_ID: string,
    COD_CAMADA_RASTER_ID: string,
  ): Promise<void> {
    this.mapasCamadasRaster = this.mapasCamadasRaster.filter(
      (mc) =>
        !(
          mc.codMapaId === COD_MAPA_ID &&
          mc.codCamadaId === COD_CAMADA_RASTER_ID
        ),
    );
  }

  async findCamadaMapaFiltrosById(
    COD_FILTRO_ID: string,
  ): Promise<MapasCamadasFiltros | null> {
    return (
      this.mapasCamadasFiltros.find(
        (f) => f.codMapaCamadaId === COD_FILTRO_ID,
      ) ?? null
    );
  }

  async addFiltrosToMapa(
    mapasCamadasFiltros: MapasCamadasFiltros,
  ): Promise<void> {
    this.mapasCamadasFiltros.push(mapasCamadasFiltros);
  }

  async removeFiltrosFromMapa(COD_FILTRO_ID: string): Promise<void> {
    this.mapasCamadasFiltros = this.mapasCamadasFiltros.filter(
      (f) => f.codMapaCamadaId !== COD_FILTRO_ID,
    );
  }
}
