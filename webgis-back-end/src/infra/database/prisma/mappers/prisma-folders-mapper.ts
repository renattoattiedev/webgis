import { Prisma, Folders as PrismaFolders } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Folders } from '@/domain/folder/enterprise/entities/folders';

export class PrismaFoldersMapper {
  static toDomain(raw: PrismaFolders): Folders {
    return Folders.create(
      {
        DSC_FOLDER: raw.DSC_FOLDER,
        COD_USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO,
      },
      new UniqueEntityID(raw.COD_FOLDER_ID.toString()),
    );
  }

  static toPrisma(folder: Folders): Prisma.FoldersUncheckedCreateInput {
    return {
      COD_FOLDER_ID: folder.id.toString(),
      DSC_FOLDER: folder.descricaoFolder,
      COD_USUARIO_CRIACAO: folder.usuarioCriacaoFolder,
    };
  }
}
