import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { Camadas } from '../../../camadas/enterprise/entities/camadas';
import { Mapas } from '../../enterprise/entities/mapas';
import { MapasCamadas } from '../../enterprise/entities/mapas-camadas';
import { MapasCamadasFiltros } from '../../enterprise/entities/mapas-camadas-filtro';
import { MapasCamadasRaster } from '../../enterprise/entities/mapas-camadas-raster';

export abstract class MapasRepository {
  abstract findById(
    COD_MAPA_ID: string,
  ): Promise<{ mapa: Mapas; camadas: Camadas[] }>;
  abstract findByNome(NOM_NOME_MAPA: string): Promise<{
    mapa: Mapas | null;
    camadasRaster: { camadaRaster: CamadasRaster; ordemRenderizacao: number }[];
    camadas: { camada: Camadas; ordemRenderizacao: number }[];
  }>;

  abstract findManyByMapas(): Promise<Mapas[]>;
  abstract findManyByMapasUserId(COD_USUARIO_CRIACAO: string): Promise<Mapas[]>;
  abstract findManyByMapasGrupoId(COD_GRUPO_ID: string): Promise<Mapas[]>;
  abstract getOrdemCamada(
    COD_MAPA_ID: string,
    COD_CAMADA_ID: string,
  ): Promise<number>;
  abstract getOrdemCamadaRaster(
    COD_MAPA_ID: string,
    COD_CAMADA_RASTER_ID: string,
  ): Promise<number>;
  abstract create(mapa: Mapas): Promise<void>;
  abstract save(mapa: Mapas): Promise<void>;
  abstract changeOwner(
    COD_MAPA_ID: string,
    COD_USUARIO_CRIACAO: string,
    COD_NEW_OWNER: string,
  ): Promise<void>;
  abstract deleteMapa(
    COD_MAPA_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void>;
  abstract findCamadaMapaById(
    COD_CAMADA_ID: string,
    COD_MAPA_ID: string,
  ): Promise<MapasCamadas | null>;
  abstract findCamadaRasterMapaById(
    COD_CAMADA_RASTER_ID: string,
    COD_MAPA_ID: string,
  ): Promise<MapasCamadasRaster | null>;
  abstract addCamadaToMapa(mapasCamadas: MapasCamadas): Promise<void>;
  abstract addCamadaRasterToMapa(
    mapasCamadasRaster: MapasCamadasRaster,
  ): Promise<void>;

  abstract removeCamadaFromMapa(
    COD_MAPA_ID: string,
    COD_CAMADA_ID: string,
  ): Promise<void>;

  abstract removeCamadaRasterFromMapa(
    COD_MAPA_ID: string,
    COD_CAMADA_RASTER_ID: string,
  ): Promise<void>;

  abstract findCamadaMapaFiltrosById(
    COD_FILTRO_ID: string,
  ): Promise<MapasCamadasFiltros | null>;

  abstract addFiltrosToMapa(
    mapasCamadasFiltros: MapasCamadasFiltros,
  ): Promise<void>;

  abstract removeFiltrosFromMapa(COD_FILTRO_ID: string): Promise<void>;
}
