import { Prisma, FoldersCamadas as PrismaFoldersCamadas } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FoldersCamadas } from '@/domain/folder/enterprise/entities/folders-camadas';

export class PrismaFoldersCamadasMapper {
  static toDomain(raw: PrismaFoldersCamadas): FoldersCamadas {
    return FoldersCamadas.create(
      {
        COD_CAMADA_ID: raw.COD_CAMADA_ID,
        COD_FOLDER_ID: raw.COD_FOLDER_ID,
      },
      new UniqueEntityID(raw.COD_FOLDER_CAMADADA_ID.toString()),
    );
  }

  static toPrisma(
    folderCamadas: FoldersCamadas,
  ): Prisma.FoldersCamadasUncheckedCreateInput {
    return {
      COD_FOLDER_CAMADADA_ID: folderCamadas.id.toString(),
      COD_CAMADA_ID: folderCamadas.codCamadaId,
      COD_FOLDER_ID: folderCamadas.codFolderId,
    };
  }
}
