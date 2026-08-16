import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  RelatoriosRepository,
  RelatorioUsoData,
  RelatorioInventarioData,
  RelatorioUsuariosData,
  AcessoPorDia,
  TopCamada,
  TabelaUsoCamada,
  AtividadeItem,
} from '@/domain/relatorios/application/repositories/relatorios-repository';

@Injectable()
export class PrismaRelatoriosRepository implements RelatoriosRepository {
  constructor(private prisma: PrismaService) {}

  async fetchUso({
    dataInicio,
    dataFim,
  }: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<RelatorioUsoData> {
    const duration = dataFim.getTime() - dataInicio.getTime();
    const prevFim = new Date(dataInicio.getTime() - 1);
    const prevInicio = new Date(dataInicio.getTime() - duration - 1);

    const periodoAtual = { gte: dataInicio, lte: dataFim };
    const periodoAnterior = { gte: prevInicio, lte: prevFim };

    const [
      logsCamadas,
      logsCamadasAnterior,
      logsRaster,
      logsMapas,
      logsMapasAnterior,
      totalCamadasAtivas,
      totalMapas,
      totalFavCamadas,
      totalFavMapas,
    ] = await Promise.all([
      this.prisma.camadasLog.count({ where: { DHS_ACESSO: periodoAtual } }),
      this.prisma.camadasLog.count({ where: { DHS_ACESSO: periodoAnterior } }),
      this.prisma.camadasRasterLog.count({
        where: { DHS_ACESSO: periodoAtual },
      }),
      this.prisma.mapasLog.count({ where: { DHS_ACESSO: periodoAtual } }),
      this.prisma.mapasLog.count({ where: { DHS_ACESSO: periodoAnterior } }),
      this.prisma.camadas.count({
        where: { FLG_CAMADA_ATIVA: true, DHS_EXCLUSAO: null },
      }),
      this.prisma.mapas.count({ where: { DHS_EXCLUSAO: null } }),
      this.prisma.favoritosCamadas.count(),
      this.prisma.favoritosMapas.count(),
    ]);

    const [
      camadasDistintas,
      camadasDistintasAnterior,
      mapasDistintos,
      mapasDistintosAnterior,
    ] = await Promise.all([
      this.prisma.camadasLog.findMany({
        where: { DHS_ACESSO: periodoAtual },
        distinct: ['COD_CAMADA_ID'],
        select: { COD_CAMADA_ID: true },
      }),
      this.prisma.camadasLog.findMany({
        where: { DHS_ACESSO: periodoAnterior },
        distinct: ['COD_CAMADA_ID'],
        select: { COD_CAMADA_ID: true },
      }),
      this.prisma.mapasLog.findMany({
        where: { DHS_ACESSO: periodoAtual },
        distinct: ['COD_MAPA_ID'],
        select: { COD_MAPA_ID: true },
      }),
      this.prisma.mapasLog.findMany({
        where: { DHS_ACESSO: periodoAnterior },
        distinct: ['COD_MAPA_ID'],
        select: { COD_MAPA_ID: true },
      }),
    ]);

    const acessosPorDiaRaw = await this.prisma.$queryRaw<
      { data: Date; total: bigint }[]
    >`
      SELECT DATE("DHS_ACESSO") as data, COUNT(*) as total
      FROM "TP_LOG_CAMADAS"
      WHERE "DHS_ACESSO" >= ${dataInicio} AND "DHS_ACESSO" <= ${dataFim}
      GROUP BY DATE("DHS_ACESSO")
      ORDER BY DATE("DHS_ACESSO")
    `;

    const acessosPorDia: AcessoPorDia[] = acessosPorDiaRaw.map((row) => ({
      data: row.data.toISOString().split('T')[0],
      total: Number(row.total),
    }));

    const topRaw = await this.prisma.camadasLog.groupBy({
      by: ['COD_CAMADA_ID'],
      where: { DHS_ACESSO: periodoAtual },
      _count: { COD_CAMADA_ID: true },
      orderBy: { _count: { COD_CAMADA_ID: 'desc' } },
      take: 10,
    });

    const topCamadas: TopCamada[] = await Promise.all(
      topRaw.map(async (item) => {
        const camada = await this.prisma.camadas.findUnique({
          where: { COD_CAMADA_ID: item.COD_CAMADA_ID },
          select: {
            NOM_NOME: true,
            grupos_camadas: { select: { NOM_NOME_GRUPO: true } },
          },
        });
        return {
          cod: item.COD_CAMADA_ID,
          nome: camada?.NOM_NOME ?? item.COD_CAMADA_ID,
          grupo: camada?.grupos_camadas?.NOM_NOME_GRUPO ?? '',
          acessos: item._count.COD_CAMADA_ID,
        };
      }),
    );

    const tabelaRaw = await this.prisma.camadasLog.groupBy({
      by: ['COD_CAMADA_ID'],
      where: { DHS_ACESSO: periodoAtual },
      _count: { COD_CAMADA_ID: true },
    });

    const tabela: TabelaUsoCamada[] = await Promise.all(
      tabelaRaw.map(async (item) => {
        const camada = await this.prisma.camadas.findUnique({
          where: { COD_CAMADA_ID: item.COD_CAMADA_ID },
          select: {
            NOM_NOME: true,
            grupos_camadas: {
              select: {
                NOM_NOME_GRUPO: true,
                temas: { select: { NOM_NOME_TEMA: true } },
              },
            },
          },
        });
        const favoritos = await this.prisma.favoritosCamadas.count({
          where: { COD_CAMADA_ID: item.COD_CAMADA_ID },
        });
        return {
          cod: item.COD_CAMADA_ID,
          nome: camada?.NOM_NOME ?? item.COD_CAMADA_ID,
          grupo: camada?.grupos_camadas?.NOM_NOME_GRUPO ?? '',
          tema: camada?.grupos_camadas?.temas?.NOM_NOME_TEMA ?? '',
          acessos: item._count.COD_CAMADA_ID,
          favoritos,
        };
      }),
    );

    const totalAcessos = logsCamadas + logsRaster + logsMapas;
    const totalAcessosAnterior = logsCamadasAnterior + logsMapasAnterior;

    return {
      kpis: {
        totalAcessos,
        totalAcessosAnterior,
        camadasAcessadas: camadasDistintas.length,
        totalCamadasAtivas,
        camadasAcessadasAnterior: camadasDistintasAnterior.length,
        mapasVisualizados: mapasDistintos.length,
        totalMapas,
        mapasVisualizadosAnterior: mapasDistintosAnterior.length,
        totalFavoritos: totalFavCamadas + totalFavMapas,
      },
      acessosPorDia,
      topCamadas,
      tabela,
    };
  }

  async fetchInventario({
    temaId,
    ativo,
  }: {
    temaId?: string;
    ativo?: boolean;
  }): Promise<RelatorioInventarioData> {
    const temaFilter = temaId
      ? { grupos_camadas: { COD_TEMA_ID: temaId } }
      : {};

    const [ativas, inativas, raster, semAtributos] = await Promise.all([
      this.prisma.camadas.count({
        where: { DHS_EXCLUSAO: null, FLG_CAMADA_ATIVA: true, ...temaFilter },
      }),
      this.prisma.camadas.count({
        where: { DHS_EXCLUSAO: null, FLG_CAMADA_ATIVA: false, ...temaFilter },
      }),
      this.prisma.camadasRaster.count({ where: { DHS_EXCLUSAO: null } }),
      this.prisma.camadas.count({
        where: { DHS_EXCLUSAO: null, atributos: { none: {} } },
      }),
    ]);

    const temasRaw = await this.prisma.temas.findMany({
      where: { DHS_EXCLUSAO: null },
      select: {
        NOM_NOME_TEMA: true,
        GruposCamadas: {
          where: { DHS_EXCLUSAO: null },
          select: {
            _count: { select: { camadas: { where: { DHS_EXCLUSAO: null } } } },
          },
        },
      },
    });

    const porTema = temasRaw
      .map((t) => ({
        tema: t.NOM_NOME_TEMA,
        total: t.GruposCamadas.reduce((sum, g) => sum + g._count.camadas, 0),
      }))
      .filter((t) => t.total > 0);

    const niveisRaw = await this.prisma.nivelCompartilhamento.findMany({
      where: { DHS_EXCLUSAO: null },
      select: {
        DSC_NIVEL_COMPATILHAMENTO: true,
        _count: { select: { camadas: { where: { DHS_EXCLUSAO: null } } } },
      },
    });

    const porNivel = niveisRaw.map((n) => ({
      nivel: n.DSC_NIVEL_COMPATILHAMENTO,
      total: n._count.camadas,
    }));

    const camadasWhere = {
      DHS_EXCLUSAO: null as null,
      ...(ativo !== undefined && { FLG_CAMADA_ATIVA: ativo }),
      ...temaFilter,
    };

    const camadasRaw = await this.prisma.camadas.findMany({
      where: camadasWhere,
      select: {
        NOM_NOME: true,
        DSC_TITULO: true,
        FLG_CAMADA_ATIVA: true,
        DHS_INCLUSAO: true,
        grupos_camadas: {
          select: {
            NOM_NOME_GRUPO: true,
            temas: { select: { NOM_NOME_TEMA: true } },
          },
        },
        nivel_compartilhamento: { select: { DSC_NIVEL_COMPATILHAMENTO: true } },
        _count: { select: { atributos: true } },
      },
      orderBy: { DHS_INCLUSAO: 'desc' },
    });

    const tabela = camadasRaw.map((c) => ({
      nome: c.NOM_NOME,
      titulo: c.DSC_TITULO,
      grupo: c.grupos_camadas?.NOM_NOME_GRUPO ?? '',
      tema: c.grupos_camadas?.temas?.NOM_NOME_TEMA ?? '',
      compartilhamento:
        c.nivel_compartilhamento?.DSC_NIVEL_COMPATILHAMENTO ?? '',
      totalAtributos: c._count.atributos,
      ativa: c.FLG_CAMADA_ATIVA,
      criadaEm: c.DHS_INCLUSAO,
    }));

    return {
      kpis: { ativas, inativas, raster, semAtributos },
      porTema,
      porNivel,
      tabela,
    };
  }

  async fetchUsuarios({
    perfil,
    diasInativo,
  }: {
    perfil?: string;
    diasInativo?: number;
  }): Promise<RelatorioUsuariosData> {
    const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [total, inativos] = await Promise.all([
      this.prisma.user.count({ where: { DHS_EXCLUSAO: null } }),
      this.prisma.user.count({
        where: {
          DHS_EXCLUSAO: null,
          OR: [
            { DHS_ULTIMA_AUTENTICACAO: { lt: trintaDiasAtras } },
            { DHS_ULTIMA_AUTENTICACAO: null },
          ],
        },
      }),
    ]);

    const perfisPrisma = await this.prisma.perfilUser.findMany({
      select: {
        DSC_PERFIL: true,
        _count: { select: { user: { where: { DHS_EXCLUSAO: null } } } },
      },
    });

    const find = (nome: string) =>
      perfisPrisma.find((p) => p.DSC_PERFIL === nome)?._count.user ?? 0;

    const porPerfil = perfisPrisma.map((p) => ({
      perfil: p.DSC_PERFIL,
      total: p._count.user,
    }));

    const diasFiltro = diasInativo ?? 30;
    const corteInatividade = new Date(
      Date.now() - diasFiltro * 24 * 60 * 60 * 1000,
    );

    const perfilFilter = perfil ? { perfil_user: { DSC_PERFIL: perfil } } : {};
    const statusFilter =
      diasInativo !== undefined
        ? {
            OR: [
              { DHS_ULTIMA_AUTENTICACAO: { lt: corteInatividade } },
              { DHS_ULTIMA_AUTENTICACAO: null },
            ],
          }
        : {};

    // recursos por usuário (em paralelo)
    const [
      camadasPorUser,
      mapasPorUser,
      rasterPorUser,
      favCamadasPorUser,
      favMapasPorUser,
      usuariosRaw,
    ] = await Promise.all([
      this.prisma.camadas.groupBy({
        by: ['COD_USUARIO_CRIACAO'],
        where: { DHS_EXCLUSAO: null },
        _count: { COD_CAMADA_ID: true },
      }),
      this.prisma.mapas.groupBy({
        by: ['COD_USUARIO_CRIACAO'],
        where: { DHS_EXCLUSAO: null },
        _count: { COD_MAPA_ID: true },
      }),
      this.prisma.camadasRaster.groupBy({
        by: ['COD_USUARIO_CRIACAO'],
        where: { DHS_EXCLUSAO: null },
        _count: { COD_CAMADA_RASTER_ID: true },
      }),
      this.prisma.favoritosCamadas.groupBy({
        by: ['COD_USER_ID'],
        _count: { COD_FAVORITO_ID: true },
      }),
      this.prisma.favoritosMapas.groupBy({
        by: ['COD_USER_ID'],
        _count: { COD_FAVORITO_ID: true },
      }),
      this.prisma.user.findMany({
        where: { DHS_EXCLUSAO: null, ...perfilFilter, ...statusFilter },
        select: {
          COD_USER_ID: true,
          NOM_USER: true,
          DSC_EMAIL: true,
          DHS_ULTIMA_AUTENTICACAO: true,
          NUM_LOGINS: true,
          perfil_user: { select: { DSC_PERFIL: true } },
        },
        orderBy: { DHS_ULTIMA_AUTENTICACAO: { sort: 'desc', nulls: 'last' } },
      }),
    ]);

    const camadasMap = new Map(
      camadasPorUser.map((g) => [
        g.COD_USUARIO_CRIACAO,
        g._count.COD_CAMADA_ID,
      ]),
    );
    const mapasMap = new Map(
      mapasPorUser.map((g) => [g.COD_USUARIO_CRIACAO, g._count.COD_MAPA_ID]),
    );
    const rasterMap = new Map(
      rasterPorUser.map((g) => [
        g.COD_USUARIO_CRIACAO,
        g._count.COD_CAMADA_RASTER_ID,
      ]),
    );
    const favCamadasMap = new Map(
      favCamadasPorUser.map((g) => [g.COD_USER_ID, g._count.COD_FAVORITO_ID]),
    );
    const favMapasMap = new Map(
      favMapasPorUser.map((g) => [g.COD_USER_ID, g._count.COD_FAVORITO_ID]),
    );

    // última atividade por usuário (max entre criação e edição em camadas e mapas)
    const ultimaAtivRaw = await this.prisma.$queryRaw<
      { user_id: string; ultima: Date }[]
    >`
      SELECT user_id, MAX(ultima) as ultima FROM (
        SELECT "COD_USUARIO_CRIACAO" as user_id,
               MAX(COALESCE("DHS_ULTIMA_ALTERACAO", "DHS_INCLUSAO")) as ultima
        FROM "TP_CAMADAS" WHERE "DHS_EXCLUSAO" IS NULL GROUP BY "COD_USUARIO_CRIACAO"
        UNION ALL
        SELECT "COD_USUARIO_ULTIMA_ALTERACAO" as user_id, MAX("DHS_ULTIMA_ALTERACAO") as ultima
        FROM "TP_CAMADAS"
        WHERE "DHS_EXCLUSAO" IS NULL AND "COD_USUARIO_ULTIMA_ALTERACAO" IS NOT NULL
        GROUP BY "COD_USUARIO_ULTIMA_ALTERACAO"
        UNION ALL
        SELECT "COD_USUARIO_CRIACAO" as user_id,
               MAX(COALESCE("DHS_ULTIMA_ALTERACAO", "DHS_INCLUSAO")) as ultima
        FROM "TP_MAPAS" WHERE "DHS_EXCLUSAO" IS NULL GROUP BY "COD_USUARIO_CRIACAO"
        UNION ALL
        SELECT "COD_USUARIO_ULTIMA_ALTERACAO" as user_id, MAX("DHS_ULTIMA_ALTERACAO") as ultima
        FROM "TP_MAPAS"
        WHERE "DHS_EXCLUSAO" IS NULL AND "COD_USUARIO_ULTIMA_ALTERACAO" IS NOT NULL
        GROUP BY "COD_USUARIO_ULTIMA_ALTERACAO"
        UNION ALL
        SELECT "COD_USUARIO_CRIACAO" as user_id,
               MAX(COALESCE("DHS_ULTIMA_ALTERACAO", "DHS_INCLUSAO")) as ultima
        FROM "TP_CAMADAS_RASTER" WHERE "DHS_EXCLUSAO" IS NULL GROUP BY "COD_USUARIO_CRIACAO"
        UNION ALL
        SELECT "COD_USUARIO_ULTIMA_ALTERACAO" as user_id, MAX("DHS_ULTIMA_ALTERACAO") as ultima
        FROM "TP_CAMADAS_RASTER"
        WHERE "DHS_EXCLUSAO" IS NULL AND "COD_USUARIO_ULTIMA_ALTERACAO" IS NOT NULL
        GROUP BY "COD_USUARIO_ULTIMA_ALTERACAO"
      ) sub GROUP BY user_id
    `;
    const ultimaAtivMap = new Map(
      ultimaAtivRaw.map((r) => [r.user_id, r.ultima]),
    );

    // feed de atividade recente (últimas 20 ações de criação/edição)
    const atividadeRaw = await this.prisma.$queryRaw<
      {
        tipo: string;
        nome: string;
        user_id: string;
        acao: string;
        data: Date;
      }[]
    >`
      SELECT tipo, nome, user_id, acao, data FROM (
        SELECT 'camada'           as tipo,
               "NOM_NOME"         as nome,
               "COD_USUARIO_CRIACAO" as user_id,
               'criou'            as acao,
               "DHS_INCLUSAO"     as data
        FROM "TP_CAMADAS" WHERE "DHS_EXCLUSAO" IS NULL
        UNION ALL
        SELECT 'camada', "NOM_NOME", "COD_USUARIO_ULTIMA_ALTERACAO", 'editou', "DHS_ULTIMA_ALTERACAO"
        FROM "TP_CAMADAS"
        WHERE "DHS_EXCLUSAO" IS NULL AND "COD_USUARIO_ULTIMA_ALTERACAO" IS NOT NULL
          AND "DHS_ULTIMA_ALTERACAO" IS NOT NULL
        UNION ALL
        SELECT 'mapa', "DSC_TITULO", "COD_USUARIO_CRIACAO", 'criou', "DHS_INCLUSAO"
        FROM "TP_MAPAS" WHERE "DHS_EXCLUSAO" IS NULL
        UNION ALL
        SELECT 'mapa', "DSC_TITULO", "COD_USUARIO_ULTIMA_ALTERACAO", 'editou', "DHS_ULTIMA_ALTERACAO"
        FROM "TP_MAPAS"
        WHERE "DHS_EXCLUSAO" IS NULL AND "COD_USUARIO_ULTIMA_ALTERACAO" IS NOT NULL
          AND "DHS_ULTIMA_ALTERACAO" IS NOT NULL
      ) events
      ORDER BY data DESC
      LIMIT 20
    `;

    // mapa de todos os usuários para resolver nomes no feed
    const allUsers = await this.prisma.user.findMany({
      where: { DHS_EXCLUSAO: null },
      select: { COD_USER_ID: true, NOM_USER: true },
    });
    const userNamesMap = new Map(
      allUsers.map((u) => [u.COD_USER_ID, u.NOM_USER]),
    );

    const atividadeRecente: AtividadeItem[] = atividadeRaw.map((a) => ({
      tipo: a.tipo as 'camada' | 'mapa',
      nome: a.nome,
      acao: a.acao as 'criou' | 'editou',
      usuario: userNamesMap.get(a.user_id) ?? 'Desconhecido',
      data: a.data,
    }));

    const tabela = usuariosRaw.map((u) => ({
      nome: u.NOM_USER,
      email: u.DSC_EMAIL,
      perfil: u.perfil_user?.DSC_PERFIL ?? '',
      ultimoAcesso: u.DHS_ULTIMA_AUTENTICACAO,
      logins: u.NUM_LOGINS,
      ativo:
        u.DHS_ULTIMA_AUTENTICACAO !== null &&
        u.DHS_ULTIMA_AUTENTICACAO >= trintaDiasAtras,
      camadas: camadasMap.get(u.COD_USER_ID) ?? 0,
      mapas: mapasMap.get(u.COD_USER_ID) ?? 0,
      raster: rasterMap.get(u.COD_USER_ID) ?? 0,
      favoritos:
        (favCamadasMap.get(u.COD_USER_ID) ?? 0) +
        (favMapasMap.get(u.COD_USER_ID) ?? 0),
      ultimaAtividade: ultimaAtivMap.get(u.COD_USER_ID) ?? null,
    }));

    return {
      kpis: {
        total,
        admins: find('Admin'),
        editores: find('Editor'),
        inativos,
      },
      porPerfil,
      tabela,
      atividadeRecente,
    };
  }
}
