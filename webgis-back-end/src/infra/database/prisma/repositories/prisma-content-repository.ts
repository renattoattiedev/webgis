/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaCamadasMapper } from '../mappers/prisma-camadas-mapper';
import { ContentRepository, UnifiedContentRow } from '@/domain/manager/application/repositories/content-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { PrismaMapasMapper } from '../mappers/prisma-mapas-mapper';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { PrismaCamadasRasterMapper } from '../mappers/prisma-camadas-raster-mapper';

@Injectable()
export class PrismaContentRepository implements ContentRepository {
  constructor(private prisma: PrismaService) {}

  async fetchCarregamentoPadrao(): Promise<UnifiedContentRow[]> {
    const rows = await this.prisma.$queryRaw<UnifiedContentRow[]>`
      SELECT
        c."COD_CAMADA_ID" AS "COD_CONTEUDO",
        c."COD_GRUPO_ID" AS "COD_GRUPO_ID",
        g."COD_TEMA_ID"   AS "COD_TEMA_ID",
        'V'::text          AS "DSC_TIPO",
        COALESCE(c."BOL_CARREGAMENTO_DEFAULT", false) AS "BOL_CARREGAMENTO_DEFAULT"
      FROM "TP_CAMADAS" c
      INNER JOIN "TA_GRUPO" g ON g."COD_GRUPO_ID" = c."COD_GRUPO_ID"
      WHERE c."DHS_EXCLUSAO" IS NULL AND c."FLG_CAMADA_ATIVA" = true AND c."BOL_CARREGAMENTO_DEFAULT" = true

      UNION ALL

      SELECT
        r."COD_CAMADA_RASTER_ID" AS "COD_CONTEUDO",
        r."COD_GRUPO_ID"         AS "COD_GRUPO_ID",
        g."COD_TEMA_ID"          AS "COD_TEMA_ID",
        'R'::text                 AS "DSC_TIPO",
        COALESCE(r."BOL_CARREGAMENTO_DEFAULT", false) AS "BOL_CARREGAMENTO_DEFAULT"
      FROM "TP_CAMADAS_RASTER" r
      INNER JOIN "TA_GRUPO" g ON g."COD_GRUPO_ID" = r."COD_GRUPO_ID"
      WHERE r."DHS_EXCLUSAO" IS NULL AND r."FLG_CAMADA_ATIVA" = true AND r."BOL_CARREGAMENTO_DEFAULT" = true

      UNION ALL

      SELECT
        m."COD_MAPA_ID" AS "COD_CONTEUDO",
        m."COD_GRUPO_ID" AS "COD_GRUPO_ID",
        g."COD_TEMA_ID"  AS "COD_TEMA_ID",
        'M'::text         AS "DSC_TIPO",
        COALESCE(m."BOL_CARREGAMENTO_DEFAULT", false) AS "BOL_CARREGAMENTO_DEFAULT"
      FROM "TP_MAPAS" m
      INNER JOIN "TA_GRUPO" g ON g."COD_GRUPO_ID" = m."COD_GRUPO_ID" 
      WHERE m."DHS_EXCLUSAO" IS NULL AND m."BOL_CARREGAMENTO_DEFAULT" = true
    `;

    return rows;
  }

  async findManyContentUserId(COD_USUARIO_CRIACAO: string): Promise<{
    mapas: Mapas[];
    camadasRaster: CamadasRaster[];
    camadas: Camadas[];
  }> {
    const camadas = await this.prisma.camadas.findMany({
      where: {
        COD_USUARIO_CRIACAO,
        DHS_EXCLUSAO: null,
      },
    });

    const camadasRaster = await this.prisma.camadasRaster.findMany({
      where: {
        COD_USUARIO_CRIACAO,
        DHS_EXCLUSAO: null,
      },
    });

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
        mapas_camadas_raster: {
          include: {
            camadas_raster: true,
          },
        },
      },
    });
    
    return {
      camadas: camadas.map(PrismaCamadasMapper.toDomain),
      camadasRaster: camadasRaster.map(PrismaCamadasRasterMapper.toDomain),
      mapas: mapas.map((mapa) => {
        const domainMapas = PrismaMapasMapper.toDomain(mapa);
    
        const dhsUltimaAlteracaoOriginal = domainMapas.updatedAt;
    
        const camadasAssociadas = mapa.mapas_camadas.map((mc) =>
          PrismaCamadasMapper.toDomain(mc.camadas),
        );
        const camadasRasterAssociadas = mapa.mapas_camadas_raster.map((mcr) =>
          PrismaCamadasRasterMapper.toDomain(mcr.camadas_raster),
        );
    
        domainMapas.setMapCamadas(camadasAssociadas);
        domainMapas.setMapCamadasRaster(camadasRasterAssociadas);
    
        if(dhsUltimaAlteracaoOriginal) {
          domainMapas.setUpdatedAt(dhsUltimaAlteracaoOriginal);
        }
    
        return domainMapas;
      }),
    };
    
  }
  
  
  async findManyContentOrganization(): Promise<{
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }> {
    const camadas = await this.prisma.camadas.findMany({
      where: {
        DHS_EXCLUSAO: null,
      },
    });

    const camadasRaster = await this.prisma.camadasRaster.findMany({
      where: {
        DHS_EXCLUSAO: null,
      },
    });

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
        mapas_camadas_raster: {
          include: {
            camadas_raster: true,
          },
        },
      },
    });

    return {
      camadas: camadas.map(PrismaCamadasMapper.toDomain),
      camadasRaster: camadasRaster.map(PrismaCamadasRasterMapper.toDomain),
      mapas: mapas.map((mapa) => {
        const domainMapas = PrismaMapasMapper.toDomain(mapa);
    
        const dhsUltimaAlteracaoOriginal = domainMapas.updatedAt;
    
        const camadasAssociadas = mapa.mapas_camadas.map((mc) =>
          PrismaCamadasMapper.toDomain(mc.camadas),
        );
        const camadasRasterAssociadas = mapa.mapas_camadas_raster.map((mcr) =>
          PrismaCamadasRasterMapper.toDomain(mcr.camadas_raster),
        );
    
        domainMapas.setMapCamadas(camadasAssociadas);
        domainMapas.setMapCamadasRaster(camadasRasterAssociadas);
    
        if(dhsUltimaAlteracaoOriginal) {
          domainMapas.setUpdatedAt(dhsUltimaAlteracaoOriginal);
        }
    
        return domainMapas;
      }),
    };
  }
}
