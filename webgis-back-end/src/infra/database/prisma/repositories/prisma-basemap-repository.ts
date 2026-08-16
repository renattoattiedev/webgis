import { BasemapsRepository } from '@/domain/basemaps/application/repositories/basemaps-repository';
import { Basemap } from '@/domain/basemaps/enterprise/entities/basemap';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaBasemapMapper } from '../mappers/prisma-basemap-mapper';

@Injectable()
export class PrismaBasemapRepository implements BasemapsRepository {
  constructor(private prisma: PrismaService) {}

  async findByNome(NOM_NOME_BASEMAP: string): Promise<Basemap | null> {
    const basemap = await (this.prisma as any).basemap.findFirst({
      where: {
        NOM_NOME_BASEMAP,
        DHS_EXCLUSAO: null,
      },
    });

    if (!basemap) {
      return null;
    }

    return PrismaBasemapMapper.toDomain(basemap);
  }

  async findById(COD_BASEMAP_ID: string): Promise<Basemap | null> {
    const basemap = await (this.prisma as any).basemap.findFirst({
      where: {
        COD_BASEMAP_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!basemap) {
      return null;
    }

    return PrismaBasemapMapper.toDomain(basemap);
  }

  async findManyByBasemapId(COD_BASEMAP_ID?: string): Promise<Basemap[]> {
    const basemaps = await (this.prisma as any).basemap.findMany({
      where: {
        COD_BASEMAP_ID,
        DHS_EXCLUSAO: null,
      },
      orderBy: [{ NUM_ORDEM: 'asc' }, { NOM_NOME_BASEMAP: 'asc' }],
    });

    return basemaps.map(PrismaBasemapMapper.toDomain);
  }

  async create(basemap: Basemap): Promise<void> {
    const data = PrismaBasemapMapper.toPrisma(basemap);

    await (this.prisma as any).basemap.create({
      data,
    });
  }

  async save(basemap: Basemap): Promise<void> {
    await (this.prisma as any).basemap.update({
      where: {
        COD_BASEMAP_ID: basemap.id.toString(),
      },
      data: {
        NOM_NOME_BASEMAP: basemap.basemapNome,
        DSC_THUMBNAIL: basemap.basemapThumbnail,
        DSC_SOURCE: basemap.basemapSource,
        JSON_WMS_PARAMS: basemap.basemapWmsParams,
        NUM_ORDEM: basemap.basemapOrdem,
        BOL_DEFAULT: basemap.basemapDefault,
        FLG_ATIVO: basemap.basemapAtivo,
        COD_USUARIO_ULTIMA_ALTERACAO: basemap.basemapUsuarioAlteracao,
      },
    });
  }

  async delete(
    COD_BASEMAP_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await (this.prisma as any).basemap.update({
      where: {
        COD_BASEMAP_ID,
      },
      data: {
        DHS_EXCLUSAO: new Date(),
        COD_USUARIO_EXCLUSAO,
      },
    });
  }
}
