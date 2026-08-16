import { Camadas } from './camadas.model';
import { CamadasRaster } from './camadas.raster.model';
import { Mapas } from './mapas.model';

export interface RespostaApi {
  camadas: Camadas[];
  camadasRaster: CamadasRaster[];
  mapas: Mapas[];
}
