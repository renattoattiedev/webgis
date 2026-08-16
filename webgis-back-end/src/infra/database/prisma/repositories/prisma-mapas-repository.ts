/* eslint-disable prettier/prettier */
import { MapasRepository } from '@/domain/mapas/application/repositories/mapas-repository';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { MapasCamadas } from '@/domain/mapas/enterprise/entities/mapas-camadas';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaMapasMapper } from '../mappers/prisma-mapas-mapper';
import { PrismaMapasCamadasMapper } from '../mappers/prisma-mapas-camadas-mapper';
import { MapasCamadasFiltros } from '@/domain/mapas/enterprise/entities/mapas-camadas-filtro';
import { PrismaMapasCamadasFiltrosMapper } from '../mappers/prisma-mapas-camadas-filter-mapper';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { PrismaCamadasMapper } from '../mappers/prisma-camadas-mapper';
import { PrismaAtributosMapper } from '../mappers/prisma-atributos-mapper';
import { MapasCamadasRaster } from '@/domain/mapas/enterprise/entities/mapas-camadas-raster';
import { PrismaMapasCamadasRasterMapper } from '../mappers/prisma-mapas-camadas-raster-mapper';
import { PrismaCamadasRasterMapper } from '../mappers/prisma-camadas-raster-mapper';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

@Injectable()
export class PrismaMapasRepository implements MapasRepository {
  constructor(private prisma: PrismaService) {}

  async findById(COD_MAPA_ID: string): Promise<{mapa: Mapas, camadas: Camadas[]}> {
    const mapasWithCamadas = await this.prisma.mapas.findUnique({
      where: {
        COD_MAPA_ID,
        DHS_EXCLUSAO: null,
      },
      include: {
        mapas_camadas: {
          include: {
            camadas: true,
          },
        },
      },
    });
  
    if (!mapasWithCamadas) {
      throw new Error('Mapa não encontrado');
    }
  
    const mapa = PrismaMapasMapper.toDomain(mapasWithCamadas);
  
    const camadas = mapasWithCamadas.mapas_camadas.map(mc => {
      return PrismaCamadasMapper.toDomain(mc.camadas);
    });
  
    return {
      mapa,
      camadas,
    };
  }  
  async findByNome(
    NOM_NOME_MAPA: string,
  ): Promise<{
    mapa: Mapas | null;
    camadasRaster: { camadaRaster: CamadasRaster; ordemRenderizacao: number }[];
    camadas: { camada: Camadas; ordemRenderizacao: number }[];
  }> {
    const mapasWithCamadas = await this.prisma.mapas.findFirst({
      where: {
        NOM_NOME_MAPA,
        DHS_EXCLUSAO: null,
      },
      include: {
        mapas_camadas: {
          include: {
            camadas: true,
          },
        },
        mapas_camadas_raster: {
          include: {
            camadas_raster: true,
          },
        },
      },
    });
  
    if (!mapasWithCamadas) {
      console.warn('Mapa não encontrado');
      return { mapa: null, camadasRaster: [], camadas: [] };
    }
  
    const mapa = PrismaMapasMapper.toDomain(mapasWithCamadas);
  
    const camadas = mapasWithCamadas.mapas_camadas.map((mc) => ({
      camada: PrismaCamadasMapper.toDomain(mc.camadas),
      ordemRenderizacao: mc.NUM_ORDEM_RENDERIZACAO,
    }));
  
    const camadasRaster = mapasWithCamadas.mapas_camadas_raster.map((mc) => ({
      camadaRaster: PrismaCamadasRasterMapper.toDomain(mc.camadas_raster),
      ordemRenderizacao: mc.NUM_ORDEM_RENDERIZACAO,
    }));
  
    return {
      mapa,
      camadasRaster,
      camadas,
    };
  }
  
  async findManyByMapas(): Promise<Mapas[]> {
    const mapas = await this.prisma.mapas.findMany({
      where: {
        DHS_EXCLUSAO: null,
      },
      include: {
        mapas_camadas: {
          include: {
            camadas: true,
          },
        },
      },
    });

    return mapas.map(PrismaMapasMapper.toDomain);
  }

  async findManyByMapasUserId(COD_USUARIO_CRIACAO: string): Promise<Mapas[]> {
    const mapas = await this.prisma.mapas.findMany({
      where: {
        COD_USUARIO_CRIACAO,
        DHS_EXCLUSAO: null,
      },
      include: {
        mapas_camadas: {
          include: {
            camadas: true,
          },
        },
      },
    });

    return mapas.map(PrismaMapasMapper.toDomain);
  }
 //aqui
  async findManyByMapasGrupoId(COD_GRUPO_ID: string): Promise<Mapas[]> {
    const mapasComCamadas = await this.prisma.mapas.findMany({
      where: {
        OR: [
          { COD_GRUPO_ID },
          { grupos_adicionais: { some: { COD_GRUPO_ID } } },
        ],
        DHS_EXCLUSAO: null,
      },
      include: {
        mapas_camadas: {
          include: {
            camadas: {
              include: {
                atributos: true,
              },
            },
          },
        },
        mapas_camadas_raster: {
          include: {
            camadas_raster: true,
          },
        },
      },
    });
  
    return mapasComCamadas.map((mapa) => {
      const domainMapa = PrismaMapasMapper.toDomain(mapa);
      const domainCamadas = mapa.mapas_camadas.map((mc) => {
        const camada = PrismaCamadasMapper.toDomain(mc.camadas);
        
        const domainAtributos = mc.camadas.atributos
          .filter((attr) => attr.NOM_NOME_ATRIBUTO !== 'id')
          .map((attr) => PrismaAtributosMapper.toDomain(attr));
        
        camada.setCamadaAtributos(domainAtributos);
        return camada;
      });
      const domainCamadasRaster = mapa.mapas_camadas_raster.map((mc) => {
        return PrismaCamadasRasterMapper.toDomain(mc.camadas_raster);
      });
      domainMapa.setMapCamadasRaster(domainCamadasRaster);
      domainMapa.setMapCamadas(domainCamadas);
      return domainMapa;
    });
  }

  async getOrdemCamada(COD_MAPA_ID: string, COD_CAMADA_ID: string): Promise<number> {
    const camada = await this.prisma.mapasCamadas.findFirst({
      where: {
        COD_MAPA_ID,
        COD_CAMADA_ID,
      },
    });
    return camada?.NUM_ORDEM_RENDERIZACAO ?? 0;
  }

  async getOrdemCamadaRaster(COD_MAPA_ID: string, COD_CAMADA_RASTER_ID: string): Promise<number> {
    const camada = await this.prisma.mapasCamadasRaster.findFirst({
      where: {
        COD_MAPA_ID,
        COD_CAMADA_RASTER_ID,
      },
    });
    return camada?.NUM_ORDEM_RENDERIZACAO ?? 0;
  }

  async create(mapa: Mapas): Promise<void> {
    const data = PrismaMapasMapper.toPrisma(mapa);

    await this.prisma.mapas.create({
      data,
    });
  }

  async save(mapa: Mapas): Promise<void> {
    const data = PrismaMapasMapper.toPrisma(mapa);

    await Promise.all([
      this.prisma.mapas.update({
        where: {
          COD_MAPA_ID: mapa.id.toString(),
        },
        data,
      }),
    ]);
  }

  async changeOwner(
    COD_MAPA_ID: string,
    COD_USUARIO_CRIACAO: string,
    COD_NEW_OWNER: string,
  ): Promise<void> {
    await this.prisma.mapas.update({
      where: {
        COD_MAPA_ID,
      },
      data: {
        COD_USUARIO_ULTIMA_ALTERACAO: COD_USUARIO_CRIACAO,
        COD_USUARIO_CRIACAO: COD_NEW_OWNER,
      },
    });
  }

  async deleteMapa(
    COD_MAPA_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      await prisma.mapas.update({
        where: {
          COD_MAPA_ID,
        },
        data: {
          DHS_EXCLUSAO: new Date(),
          COD_USUARIO_EXCLUSAO,
        },
      });
  
      await prisma.mapasCamadas.deleteMany({
        where: {
          COD_MAPA_ID,
        },
      });
  
      await prisma.foldersMapas.deleteMany({
        where: {
          COD_MAPA_ID,
        },
      });
    });
  }
  

  async findCamadaMapaById(
    COD_CAMADA_ID: string,
    COD_MAPA_ID: string,
  ): Promise<MapasCamadas | null> {
    const mapasCamadas = await this.prisma.mapasCamadas.findFirst({
      where: {
        COD_CAMADA_ID,
        COD_MAPA_ID,
      },
    });

    if (!mapasCamadas) {
      return null;
    }

    return PrismaMapasCamadasMapper.toDomain(mapasCamadas);
  }

  async findCamadaRasterMapaById(COD_CAMADA_RASTER_ID: string, COD_MAPA_ID: string): Promise<MapasCamadasRaster | null> {
    const mapasCamadas = await this.prisma.mapasCamadasRaster.findFirst({
      where: {
        COD_CAMADA_RASTER_ID,
        COD_MAPA_ID,
      },
    });

    if (!mapasCamadas) {
      return null;
    }

    return PrismaMapasCamadasRasterMapper.toDomain(mapasCamadas);
  }

  async addCamadaToMapa(mapasCamadas: MapasCamadas): Promise<void> {
    const data = PrismaMapasCamadasMapper.toPrisma(mapasCamadas); 

    await this.prisma.mapasCamadas.create({
      data,
    });
  }

  async addCamadaRasterToMapa(mapasCamadasRaster: MapasCamadasRaster): Promise<void> {
    const data = PrismaMapasCamadasRasterMapper.toPrisma(mapasCamadasRaster); 

    await this.prisma.mapasCamadasRaster.create({
      data,
    });  
  }

  async removeCamadaFromMapa(COD_MAPA_ID: string, COD_CAMADA_ID: string): Promise<void> {
    await this.prisma.mapasCamadas.deleteMany({
      where: {
        COD_MAPA_ID,
        COD_CAMADA_ID,
      },
    });
  }

  async removeCamadaRasterFromMapa(COD_MAPA_ID: string, COD_CAMADA_RASTER_ID: string): Promise<void> {
    await this.prisma.mapasCamadasRaster.deleteMany({
      where: {
        COD_MAPA_ID,
        COD_CAMADA_RASTER_ID,
      },
    });
  }  

  async findCamadaMapaFiltrosById(
    COD_FILTRO_ID: string,
  ): Promise<MapasCamadasFiltros | null> {
    const mapasCamadasFiltros = await this.prisma.mapasCamadasFiltros.findUnique({
      where: {
        COD_FILTRO_ID,
      },
    });

    if (!mapasCamadasFiltros) {
      return null;
    }

    return PrismaMapasCamadasFiltrosMapper.toDomain(mapasCamadasFiltros);
  }

  async addFiltrosToMapa(
    mapasCamadasFiltros: MapasCamadasFiltros,
  ): Promise<void> {
    const data = PrismaMapasCamadasFiltrosMapper.toPrisma(mapasCamadasFiltros);

    await this.prisma.mapasCamadasFiltros.create({
      data,
    });
  }

  async removeFiltrosFromMapa(
    COD_FILTRO_ID: string,
  ): Promise<void> {
    await this.prisma.mapasCamadasFiltros.delete({
      where: {
        COD_FILTRO_ID,
      },
    });
  }
}
