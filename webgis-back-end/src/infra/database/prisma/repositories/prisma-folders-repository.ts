import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FoldersRepository } from '@/domain/folder/application/repositories/foders-repository';
import { Folders } from '@/domain/folder/enterprise/entities/folders';
import { PrismaFoldersMapper } from '../mappers/prisma-folders-mapper';
import { PrismaFoldersCamadasMapper } from '../mappers/prisma-folders-camadas-mapper';
import { FoldersCamadas } from '@/domain/folder/enterprise/entities/folders-camadas';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { PrismaCamadasMapper } from '../mappers/prisma-camadas-mapper';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { PrismaMapasMapper } from '../mappers/prisma-mapas-mapper';
import { FoldersMapas } from '@/domain/folder/enterprise/entities/folders-mapas';
import { PrismaFoldersMapasMapper } from '../mappers/prisma-folders-mapas-mapper';
import { FoldersCamadasRaster } from '@/domain/folder/enterprise/entities/folders-camadas-raster';
import { PrismaFoldersCamadasRasterMapper } from '../mappers/prisma-folders-camadas-raster-mapper';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { PrismaCamadasRasterMapper } from '../mappers/prisma-camadas-raster-mapper';

@Injectable()
export class PrismaFoldersRepository implements FoldersRepository {
  constructor(private prisma: PrismaService) {}
  async findById(COD_FOLDER_ID: string): Promise<Folders | null> {
    const folder = await this.prisma.folders.findUnique({
      where: {
        COD_FOLDER_ID,
      },
    });

    if (!folder) {
      return null;
    }

    return PrismaFoldersMapper.toDomain(folder);
  }

  async findByUserId(COD_USUARIO_CRIACAO: string): Promise<Folders[]> {
    const folders = await this.prisma.folders.findMany({
      where: {
        COD_USUARIO_CRIACAO,
      },
      orderBy: {
        DSC_FOLDER: 'asc',
      },
    });

    return folders.map(PrismaFoldersMapper.toDomain);
  }

  async create(folder: Folders): Promise<void> {
    const data = PrismaFoldersMapper.toPrisma(folder);

    await this.prisma.folders.create({
      data,
    });
  }

  async save(folder: Folders): Promise<void> {
    const data = PrismaFoldersMapper.toPrisma(folder);

    await Promise.all([
      this.prisma.folders.update({
        where: {
          COD_FOLDER_ID: folder.id.toString(),
        },
        data,
      }),
    ]);
  }

  async removeFolder(COD_FOLDER_ID: string): Promise<void> {
    await Promise.all([
      this.prisma.folders.delete({
        where: {
          COD_FOLDER_ID,
        },
      }),
    ]);
  }

  // Camadas
  async findCamadaFoldersById(
    COD_FOLDER_ID: string,
    COD_CAMADA_ID: string,
  ): Promise<FoldersCamadas | null> {
    const folderCamadas = await this.prisma.foldersCamadas.findFirst({
      where: {
        COD_FOLDER_ID,
        COD_CAMADA_ID,
      },
    });
    if (!folderCamadas) {
      return null;
    }

    return PrismaFoldersCamadasMapper.toDomain(folderCamadas);
  }

  async findCamadaRasterFoldersById(
    COD_FOLDER_ID: string,
    COD_CAMADA_RASTER_ID: string,
  ): Promise<FoldersCamadasRaster | null> {
    const folderCamadasRaster =
      await this.prisma.foldersCamadasRaster.findFirst({
        where: {
          COD_FOLDER_ID,
          COD_CAMADA_RASTER_ID,
        },
      });
    if (!folderCamadasRaster) {
      return null;
    }

    return PrismaFoldersCamadasRasterMapper.toDomain(folderCamadasRaster);
  }

  async addCamadaToFolder(folderCamada: FoldersCamadas): Promise<void> {
    const data = PrismaFoldersCamadasMapper.toPrisma(folderCamada);

    await this.prisma.foldersCamadas.create({
      data,
    });
  }

  async addCamadaRasterToFolder(
    folderCamadaRaster: FoldersCamadasRaster,
  ): Promise<void> {
    const data = PrismaFoldersCamadasRasterMapper.toPrisma(folderCamadaRaster);

    await this.prisma.foldersCamadasRaster.create({
      data,
    });
  }

  async removeFolderCamada(COD_FOLDER_CAMADADA_ID: string): Promise<void> {
    await Promise.all([
      this.prisma.foldersCamadas.delete({
        where: {
          COD_FOLDER_CAMADADA_ID,
        },
      }),
    ]);
  }

  async removeFolderCamadaRaster(
    COD_FOLDER_CAMADADA_RASTER_ID: string,
  ): Promise<void> {
    await Promise.all([
      this.prisma.foldersCamadasRaster.delete({
        where: {
          COD_FOLDER_CAMADADA_RASTER_ID,
        },
      }),
    ]);
  }

  // Mapas
  async findMapaFoldersById(
    COD_FOLDER_ID: string,
    COD_MAPA_ID: string,
  ): Promise<FoldersMapas | null> {
    const folderMapas = await this.prisma.foldersMapas.findFirst({
      where: {
        COD_FOLDER_ID,
        COD_MAPA_ID,
      },
    });
    if (!folderMapas) {
      return null;
    }

    return PrismaFoldersMapasMapper.toDomain(folderMapas);
  }

  async addMapaToFolder(folderMapa: FoldersMapas): Promise<void> {
    const data = PrismaFoldersMapasMapper.toPrisma(folderMapa);

    await this.prisma.foldersMapas.create({
      data,
    });
  }

  async removeFolderMapa(COD_FOLDER_MAPA_ID: string): Promise<void> {
    await Promise.all([
      this.prisma.foldersMapas.delete({
        where: {
          COD_FOLDER_MAPA_ID,
        },
      }),
    ]);
  }

  // Content
  async findContentByFolderId(COD_FOLDER_ID: string): Promise<{
    folder: Folders;
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }> {
    const folderWithContent = await this.prisma.folders.findUnique({
      where: {
        COD_FOLDER_ID,
      },
      include: {
        folders_camadas: {
          include: {
            camadas: true,
          },
        },
        folders_camadas_raster: {
          include: {
            camadas_raster: true,
          },
        },
        folders_mapas: {
          include: {
            mapas: {
              include: {
                mapas_camadas: {
                  include: {
                    camadas: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!folderWithContent) {
      throw new Error('Pasta não encontrada');
    }

    const folder = PrismaFoldersMapper.toDomain(folderWithContent);

    const camadas = folderWithContent.folders_camadas.map((fc) =>
      PrismaCamadasMapper.toDomain(fc.camadas),
    );

    const camadasRaster = folderWithContent.folders_camadas_raster.map((fc) =>
      PrismaCamadasRasterMapper.toDomain(fc.camadas_raster),
    );

    const mapas = folderWithContent.folders_mapas.map((fm) => {
      const mapa = PrismaMapasMapper.toDomain(fm.mapas);
      const camadasAssociadas = fm.mapas.mapas_camadas.map((mc) =>
        PrismaCamadasMapper.toDomain(mc.camadas),
      );
      mapa.setMapCamadas(camadasAssociadas);
      return mapa;
    });

    return {
      folder,
      camadas,
      camadasRaster,
      mapas,
    };
  }

  async getFolderIdFromMapaId(
    COD_MAPA_ID: string,
    COD_USER_ID: string,
  ): Promise<string | null> {
    const folderMap = await this.prisma.foldersMapas.findFirst({
      where: {
        folders: {
          COD_USUARIO_CRIACAO: COD_USER_ID,
        },
        COD_MAPA_ID: COD_MAPA_ID,
      },
      select: {
        COD_FOLDER_MAPA_ID: true,
      },
    });

    if (!folderMap) {
      return null;
    }

    return folderMap.COD_FOLDER_MAPA_ID;
  }

  async getFolderIdFromCamadaId(
    COD_CAMADA_ID: string,
    COD_USER_ID: string,
  ): Promise<string | null> {
    const folderCamada = await this.prisma.foldersCamadas.findFirst({
      where: {
        folders: {
          COD_USUARIO_CRIACAO: COD_USER_ID,
        },
        COD_CAMADA_ID: COD_CAMADA_ID,
      },
      select: {
        COD_FOLDER_CAMADADA_ID: true,
      },
    });

    if (!folderCamada) {
      return null;
    }

    return folderCamada.COD_FOLDER_CAMADADA_ID;
  }

  async getFolderIdFromCamadaRasterId(
    COD_CAMADA_RASTER_ID: string,
    COD_USER_ID: string,
  ): Promise<string | null> {
    const folderCamada = await this.prisma.foldersCamadasRaster.findFirst({
      where: {
        folders: {
          COD_USUARIO_CRIACAO: COD_USER_ID,
        },
        COD_CAMADA_RASTER_ID: COD_CAMADA_RASTER_ID,
      },
      select: {
        COD_FOLDER_CAMADADA_RASTER_ID: true,
      },
    });

    if (!folderCamada) {
      return null;
    }

    return folderCamada.COD_FOLDER_CAMADADA_RASTER_ID;
  }
}
