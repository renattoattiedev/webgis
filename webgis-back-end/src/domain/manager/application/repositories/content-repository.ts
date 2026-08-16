import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

export type UnifiedContentRow = {
  COD_CONTEUDO: string;
  COD_GRUPO_ID: string;
  COD_TEMA_ID: string;
  DSC_TIPO: 'V' | 'R' | 'M';
  BOL_CARREGAMENTO_DEFAULT: boolean;
};

export abstract class ContentRepository {
  abstract findManyContentUserId(COD_USUARIO_CRIACAO: string): Promise<{
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }>;

  abstract findManyContentOrganization(): Promise<{
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }>;

  abstract fetchCarregamentoPadrao(): Promise<UnifiedContentRow[]>;
}
