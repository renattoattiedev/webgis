import { Controller, Get } from '@nestjs/common';
import { Public } from '@/infra/auth/public';
import { PrismaService } from '@/infra/database/prisma/prisma.service';

@Controller('/dados-catalogo')
export class FetchDadosCatalogoController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Public()
  async handle() {
    const [temasRaw, camadasRaw, camadasRasterRaw, mapasRaw] =
      await Promise.all([
        this.prisma.temas.findMany({
          where: { DHS_EXCLUSAO: null },
          include: {
            GruposCamadas: {
              where: { DHS_EXCLUSAO: null },
              orderBy: { NOM_NOME_GRUPO: 'asc' },
            },
          },
          orderBy: { NOM_NOME_TEMA: 'asc' },
        }),
        this.prisma.camadas.findMany({
          where: { DHS_EXCLUSAO: null, FLG_CAMADA_ATIVA: true },
          include: {
            grupos_camadas: { include: { temas: true } },
            _count: { select: { logs: true } },
          },
          orderBy: { DHS_INCLUSAO: 'desc' },
        }),
        this.prisma.camadasRaster.findMany({
          where: { DHS_EXCLUSAO: null, FLG_CAMADA_ATIVA: true },
          include: {
            grupos_camadas_raster: { include: { temas: true } },
            _count: { select: { logs: true } },
          },
          orderBy: { DHS_INCLUSAO: 'desc' },
        }),
        this.prisma.mapas.findMany({
          where: { DHS_EXCLUSAO: null },
          include: {
            grupos_mapas: { include: { temas: true } },
            _count: { select: { logs: true } },
          },
          orderBy: { DHS_INCLUSAO: 'desc' },
        }),
      ]);

    const temas = temasRaw.map((t) => ({
      id: t.COD_TEMA_ID,
      nome: t.NOM_NOME_TEMA,
      grupos: t.GruposCamadas.map((g) => ({
        id: g.COD_GRUPO_ID,
        nome: g.NOM_NOME_GRUPO,
      })),
    }));

    const camadas = camadasRaw.map((c) => ({
      id: c.COD_CAMADA_ID,
      tipo: 'vetorial' as const,
      nomeCamada: c.NOM_NOME,
      titulo: c.DSC_TITULO,
      descricao: c.DSC_DESCRICAO,
      grupoId: c.COD_GRUPO_ID,
      grupoNome: c.grupos_camadas.NOM_NOME_GRUPO,
      temaId: c.grupos_camadas.COD_TEMA_ID,
      temaNome: c.grupos_camadas.temas.NOM_NOME_TEMA,
      tags: c.TXT_TAGS,
      linkMetadados: c.DSC_LINK_METADADOS,
      boundingBox: c.DSC_BOUNDING_BOX,
      atualizado: (c.DHS_ULTIMA_ALTERACAO ?? c.DHS_INCLUSAO).toISOString(),
      acessos: c._count.logs,
    }));

    const camadasRaster = camadasRasterRaw.map((c) => ({
      id: c.COD_CAMADA_RASTER_ID,
      tipo: 'raster' as const,
      nomeCamada: c.NOM_NOME,
      titulo: c.DSC_TITULO,
      descricao: c.DSC_DESCRICAO,
      grupoId: c.COD_GRUPO_ID,
      grupoNome: c.grupos_camadas_raster.NOM_NOME_GRUPO,
      temaId: c.grupos_camadas_raster.COD_TEMA_ID,
      temaNome: c.grupos_camadas_raster.temas.NOM_NOME_TEMA,
      tags: c.TXT_TAGS,
      linkMetadados: c.DSC_LINK_METADADOS,
      boundingBox: c.DSC_BOUNDING_BOX,
      atualizado: (c.DHS_ULTIMA_ALTERACAO ?? c.DHS_INCLUSAO).toISOString(),
      acessos: c._count.logs,
    }));

    const mapas = mapasRaw.map((m) => ({
      id: m.COD_MAPA_ID,
      tipo: 'mapa' as const,
      nomeCamada: m.NOM_NOME_MAPA,
      titulo: m.DSC_TITULO,
      descricao: m.DSC_DESCRICAO,
      grupoId: m.COD_GRUPO_ID,
      grupoNome: m.grupos_mapas.NOM_NOME_GRUPO,
      temaId: m.grupos_mapas.COD_TEMA_ID,
      temaNome: m.grupos_mapas.temas.NOM_NOME_TEMA,
      tags: null as string | null,
      linkMetadados: null as string | null,
      boundingBox: m.DSC_BOUNDING_BOX,
      atualizado: (m.DHS_ULTIMA_ALTERACAO ?? m.DHS_INCLUSAO).toISOString(),
      acessos: m._count.logs,
    }));

    return { temas, camadas, camadasRaster, mapas };
  }
}
