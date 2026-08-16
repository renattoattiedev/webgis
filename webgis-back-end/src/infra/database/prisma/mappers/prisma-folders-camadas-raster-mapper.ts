import {
  Prisma,
  FoldersCamadasRaster as PrismaFoldersCamadasRaster,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FoldersCamadasRaster } from '@/domain/folder/enterprise/entities/folders-camadas-raster';

export class PrismaFoldersCamadasRasterMapper {
  static toDomain(raw: PrismaFoldersCamadasRaster): FoldersCamadasRaster {
    return FoldersCamadasRaster.create(
      {
        COD_CAMADA_RASTER_ID: raw.COD_CAMADA_RASTER_ID,
        COD_FOLDER_ID: raw.COD_FOLDER_ID,
      },
      new UniqueEntityID(raw.COD_FOLDER_CAMADADA_RASTER_ID.toString()),
    );
  }

  static toPrisma(
    foldersCamadasRaster: FoldersCamadasRaster,
  ): Prisma.FoldersCamadasRasterUncheckedCreateInput {
    return {
      COD_FOLDER_CAMADADA_RASTER_ID: foldersCamadasRaster.id.toString(),
      COD_CAMADA_RASTER_ID: foldersCamadasRaster.codCamadaId,
      COD_FOLDER_ID: foldersCamadasRaster.codFolderId,
    };
  }
}
