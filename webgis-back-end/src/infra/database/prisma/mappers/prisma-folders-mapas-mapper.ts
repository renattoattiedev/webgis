import { Prisma, FoldersMapas as PrismaFoldersMapas } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { FoldersMapas } from '@/domain/folder/enterprise/entities/folders-mapas';

export class PrismaFoldersMapasMapper {
  static toDomain(raw: PrismaFoldersMapas): FoldersMapas {
    return FoldersMapas.create(
      {
        COD_MAPA_ID: raw.COD_MAPA_ID,
        COD_FOLDER_ID: raw.COD_FOLDER_ID,
      },
      new UniqueEntityID(raw.COD_FOLDER_MAPA_ID.toString()),
    );
  }

  static toPrisma(
    folderMapas: FoldersMapas,
  ): Prisma.FoldersMapasUncheckedCreateInput {
    return {
      COD_FOLDER_MAPA_ID: folderMapas.id.toString(),
      COD_MAPA_ID: folderMapas.codMapaId,
      COD_FOLDER_ID: folderMapas.codFolderId,
    };
  }
}
