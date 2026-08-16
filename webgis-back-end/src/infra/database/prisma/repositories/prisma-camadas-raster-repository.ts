import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaCamadasRasterMapper } from '../mappers/prisma-camadas-raster-mapper';

@Injectable()
export class PrismaCamadasRasterRepository implements CamadasRasterRepository {
  constructor(private prisma: PrismaService) {}

  async findByNome(NOM_NOME: string): Promise<CamadasRaster | null> {
    const camada = await this.prisma.camadasRaster.findFirst({
      where: {
        NOM_NOME,
        DHS_EXCLUSAO: null,
      },
    });

    if (!camada) {
      return null;
    }

    //LOG de Acesso
    await this.prisma.camadasRasterLog.create({
      data: {
        COD_CAMADA_RASTER_ID: camada.COD_CAMADA_RASTER_ID,
      },
    });

    return PrismaCamadasRasterMapper.toDomain(camada);
  }

  async findByNomeFonte(
    NOM_NOME: string,
    DSC_FONTE_DADOS_CAMADA: string,
  ): Promise<CamadasRaster | null> {
    const camada = await this.prisma.camadasRaster.findFirst({
      where: {
        NOM_NOME,
        DSC_FONTE_DADOS_CAMADA,
        DHS_EXCLUSAO: null,
      },
    });

    if (!camada) {
      return null;
    }

    //LOG de Acesso
    await this.prisma.camadasRasterLog.create({
      data: {
        COD_CAMADA_RASTER_ID: camada.COD_CAMADA_RASTER_ID,
      },
    });

    return PrismaCamadasRasterMapper.toDomain(camada);
  }

  async findByFonte(
    DSC_FONTE_DADOS_CAMADA: string,
  ): Promise<CamadasRaster | null> {
    const camada = await this.prisma.camadasRaster.findFirst({
      where: {
        DSC_FONTE_DADOS_CAMADA,
        DHS_EXCLUSAO: null,
      },
    });

    if (!camada) {
      return null;
    }

    return PrismaCamadasRasterMapper.toDomain(camada);
  }

  async findById(COD_CAMADA_RASTER_ID: string): Promise<CamadasRaster | null> {
    const camada = await this.prisma.camadasRaster.findUnique({
      where: {
        COD_CAMADA_RASTER_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!camada) {
      return null;
    }

    //LOG de Acesso
    await this.prisma.camadasRasterLog.create({
      data: {
        COD_CAMADA_RASTER_ID: camada.COD_CAMADA_RASTER_ID,
      },
    });

    return PrismaCamadasRasterMapper.toDomain(camada);
  }

  async findManyByCamadasId(NOM_NOME): Promise<CamadasRaster[]> {
    const camada = await this.prisma.camadasRaster.findMany({
      where: {
        NOM_NOME,
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camada.map(PrismaCamadasRasterMapper.toDomain);
  }

  async findManyByCamadasUserId(COD_USUARIO_CRIACAO): Promise<CamadasRaster[]> {
    const camada = await this.prisma.camadasRaster.findMany({
      where: {
        COD_USUARIO_CRIACAO,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camada.map(PrismaCamadasRasterMapper.toDomain);
  }

  async findManyByCamadasGrupoId(
    COD_GRUPO_ID: string,
  ): Promise<CamadasRaster[]> {
    const camadasComAtributos = await this.prisma.camadasRaster.findMany({
      where: {
        OR: [
          { COD_GRUPO_ID },
          { grupos_adicionais: { some: { COD_GRUPO_ID } } },
        ],
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camadasComAtributos.map((camada) => {
      const domainCamada = PrismaCamadasRasterMapper.toDomain(camada);
      return domainCamada;
    });
  }

  async findManyAtivas(): Promise<CamadasRaster[]> {
    const camadas = await this.prisma.camadasRaster.findMany({
      where: {
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camadas.map(PrismaCamadasRasterMapper.toDomain);
  }

  async create(camada: CamadasRaster): Promise<void> {
    const data = PrismaCamadasRasterMapper.toPrisma(camada);

    await this.prisma.camadasRaster.create({
      data,
    });
  }

  async save(camada: CamadasRaster): Promise<void> {
    const data = PrismaCamadasRasterMapper.toPrisma(camada);

    await Promise.all([
      this.prisma.camadasRaster.update({
        where: {
          COD_CAMADA_RASTER_ID: camada.id.toString(),
        },
        data,
      }),
    ]);
  }

  async changeOwner(
    COD_CAMADA_RASTER_ID: string,
    COD_USUARIO_CRIACAO: string,
    COD_NEW_OWNER: string,
  ): Promise<void> {
    await this.prisma.camadasRaster.update({
      where: {
        COD_CAMADA_RASTER_ID,
        COD_USUARIO_CRIACAO,
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      data: {
        COD_USUARIO_CRIACAO: COD_NEW_OWNER,
        DHS_ULTIMA_ALTERACAO: new Date(),
      },
    });
  }
  async deleteCamada(
    COD_CAMADA_RASTER_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await this.prisma.camadasRaster.update({
      where: {
        COD_CAMADA_RASTER_ID,
        DHS_EXCLUSAO: null,
      },
      data: {
        DHS_EXCLUSAO: new Date(),
        COD_USUARIO_EXCLUSAO,
      },
    });
    await this.prisma.foldersCamadasRaster.deleteMany({
      where: {
        COD_CAMADA_RASTER_ID,
      },
    });

    await this.prisma.mapasCamadasRaster.deleteMany({
      where: {
        COD_CAMADA_RASTER_ID,
      },
    });
  }

  async recoveryCamada(COD_CAMADA_RASTER_ID: string): Promise<void> {
    await this.prisma.camadasRaster.update({
      where: {
        COD_CAMADA_RASTER_ID,
        DHS_EXCLUSAO: {
          not: null,
        },
      },
      data: {
        DHS_EXCLUSAO: null,
      },
    });
  }
  async deactivateCamada(COD_CAMADA_RASTER_ID: string): Promise<void> {
    await this.prisma.camadasRaster.update({
      where: {
        COD_CAMADA_RASTER_ID,
        FLG_CAMADA_ATIVA: true,
      },
      data: {
        FLG_CAMADA_ATIVA: false,
      },
    });
  }

  async activateCamada(COD_CAMADA_RASTER_ID: string): Promise<void> {
    await this.prisma.camadasRaster.update({
      where: {
        COD_CAMADA_RASTER_ID,
        FLG_CAMADA_ATIVA: false,
      },
      data: {
        FLG_CAMADA_ATIVA: true,
      },
    });
  }
}
