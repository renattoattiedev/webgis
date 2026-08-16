import { Folders } from '../../enterprise/entities/folders';
import { Camadas } from '../../../camadas/enterprise/entities/camadas';
import { FoldersCamadas } from '../../enterprise/entities/folders-camadas';
import { FoldersMapas } from '../../enterprise/entities/folders-mapas';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { FoldersCamadasRaster } from '../../enterprise/entities/folders-camadas-raster';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

export abstract class FoldersRepository {
  abstract findById(COD_FOLDER_ID: string): Promise<Folders | null>;

  abstract findByUserId(COD_USUARIO_CRIACAO: string): Promise<Folders[]>;

  abstract create(folder: Folders): Promise<void>;
  abstract save(folder: Folders): Promise<void>;
  abstract removeFolder(COD_FOLDER_ID: string): Promise<void>;

  //Camadas

  abstract findCamadaFoldersById(
    COD_FOLDER_ID: string,
    COD_CAMADA_ID: string,
  ): Promise<FoldersCamadas | null>;

  abstract getFolderIdFromCamadaId(
    COD_CAMADA_ID: string,
    COD_USER_ID: string,
  ): Promise<string | null>;

  abstract addCamadaToFolder(folderCamada: FoldersCamadas): Promise<void>;
  abstract removeFolderCamada(COD_FOLDER_ID: string): Promise<void>;

  //Camadas Raster

  abstract findCamadaRasterFoldersById(
    COD_FOLDER_ID: string,
    COD_CAMADA_RASTER_ID: string,
  ): Promise<FoldersCamadasRaster | null>;

  abstract getFolderIdFromCamadaRasterId(
    COD_CAMADA_RASTER_ID: string,
    COD_USER_ID: string,
  ): Promise<string | null>;

  abstract addCamadaRasterToFolder(
    foldersCamadasRaster: FoldersCamadasRaster,
  ): Promise<void>;
  abstract removeFolderCamadaRaster(
    COD_FOLDER_CAMADADA_RASTER_ID: string,
  ): Promise<void>;

  //Mapas

  abstract findMapaFoldersById(
    COD_FOLDER_ID: string,
    COD_MAPA_ID: string,
  ): Promise<FoldersMapas | null>;

  abstract getFolderIdFromMapaId(
    COD_MAPA_ID: string,
    COD_USER_ID: string,
  ): Promise<string | null>;

  abstract addMapaToFolder(folderMapa: FoldersMapas): Promise<void>;
  abstract removeFolderMapa(COD_FOLDER_ID: string): Promise<void>;

  //FetchContent

  abstract findContentByFolderId(COD_FOLDER_ID: string): Promise<{
    folder: Folders;
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }>;
}
