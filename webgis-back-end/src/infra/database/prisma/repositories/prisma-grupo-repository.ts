import {
  GrupoRepository,
  GrupoOverviewRow,
} from '@/domain/manager/application/repositories/grupo-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaGrupoMapper } from '../mappers/prisma-grupo-mapper';

@Injectable()
export class PrismaGrupoRepository implements GrupoRepository {
  constructor(private prisma: PrismaService) {}

  async findByNome(NOM_NOME_GRUPO: string): Promise<Grupo | null> {
    const grupoCamada = await this.prisma.grupo.findFirst({
      where: {
        NOM_NOME_GRUPO,
        DHS_EXCLUSAO: null,
      },
    });

    if (!grupoCamada) {
      return null;
    }

    return PrismaGrupoMapper.toDomain(grupoCamada);
  }

  async findBySigla(SGL_GRUPO_ID: string): Promise<Grupo | null> {
    const grupoCamada = await this.prisma.grupo.findFirst({
      where: {
        SGL_GRUPO_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!grupoCamada) {
      return null;
    }

    return PrismaGrupoMapper.toDomain(grupoCamada);
  }

  async findById(COD_GRUPO_ID: string): Promise<Grupo | null> {
    const grupoCamada = await this.prisma.grupo.findUnique({
      where: {
        COD_GRUPO_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!grupoCamada) {
      return null;
    }

    return PrismaGrupoMapper.toDomain(grupoCamada);
  }

  async findManyByGrupoId(COD_GRUPO_ID: string): Promise<Grupo[]> {
    const grupo = await this.prisma.grupo.findMany({
      where: {
        COD_GRUPO_ID,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return grupo.map(PrismaGrupoMapper.toDomain);
  }

  async findManyByGrupoTemaId(COD_TEMA_ID: string): Promise<Grupo[]> {
    const grupoTema = await this.prisma.grupo.findMany({
      where: {
        COD_TEMA_ID,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return grupoTema.map(PrismaGrupoMapper.toDomain);
  }

  async findManyAtivos(): Promise<Grupo[]> {
    const grupos = await this.prisma.grupo.findMany({
      where: { DHS_EXCLUSAO: null },
    });
    return grupos.map(PrismaGrupoMapper.toDomain);
  }

  async findManyOverview(userId?: string | null): Promise<GrupoOverviewRow[]> {
    const [
      grupos,
      niveis,
      camadasPorNivel,
      rastersPorNivel,
      mapasPorNivel,
      membros,
      camadasAdicionais,
      rastersAdicionais,
      mapasAdicionais,
    ] = await Promise.all([
      this.prisma.grupo.findMany({
        where: { DHS_EXCLUSAO: null },
        include: { temas: true },
        orderBy: { NOM_NOME_GRUPO: 'asc' },
      }),
      this.prisma.nivelCompartilhamento.findMany({
        where: { DHS_EXCLUSAO: null },
      }),
      this.prisma.camadas.groupBy({
        by: ['COD_GRUPO_ID', 'COD_NIVEL_COMPATILHAMENTO'],
        where: { DHS_EXCLUSAO: null },
        _count: { _all: true },
      }),
      this.prisma.camadasRaster.groupBy({
        by: ['COD_GRUPO_ID', 'COD_NIVEL_COMPATILHAMENTO'],
        where: { DHS_EXCLUSAO: null },
        _count: { _all: true },
      }),
      this.prisma.mapas.groupBy({
        by: ['COD_GRUPO_ID', 'COD_NIVEL_COMPATILHAMENTO'],
        where: { DHS_EXCLUSAO: null },
        _count: { _all: true },
      }),
      this.prisma.grupoMembros.groupBy({
        by: ['COD_GRUPO_ID'],
        where: { DHS_EXCLUSAO: null, DSC_STATUS: 'membro' },
        _count: { _all: true },
      }),
      this.prisma.camadaGrupoAdicional.findMany({
        where: { camada: { DHS_EXCLUSAO: null } },
        select: {
          COD_GRUPO_ID: true,
          camada: {
            select: {
              COD_NIVEL_COMPATILHAMENTO: true,
              COD_USUARIO_CRIACAO: true,
            },
          },
        },
      }),
      this.prisma.camadaRasterGrupoAdicional.findMany({
        where: { camadaRaster: { DHS_EXCLUSAO: null } },
        select: {
          COD_GRUPO_ID: true,
          camadaRaster: {
            select: {
              COD_NIVEL_COMPATILHAMENTO: true,
              COD_USUARIO_CRIACAO: true,
            },
          },
        },
      }),
      this.prisma.mapaGrupoAdicional.findMany({
        where: { mapa: { DHS_EXCLUSAO: null } },
        select: {
          COD_GRUPO_ID: true,
          mapa: {
            select: {
              COD_NIVEL_COMPATILHAMENTO: true,
              COD_USUARIO_CRIACAO: true,
            },
          },
        },
      }),
    ]);

    const nivelLabelPorId = new Map(
      niveis.map((n) => [
        n.COD_NIVEL_COMPATILHAMENTO,
        n.DSC_NIVEL_COMPATILHAMENTO,
      ]),
    );
    const privadoId = niveis.find(
      (n) => n.DSC_NIVEL_COMPATILHAMENTO === 'Privado',
    )?.COD_NIVEL_COMPATILHAMENTO;

    const LABELS_ESPERADOS = ['Público', 'Institucional', 'Privado'];
    const labelsEncontrados = new Set(nivelLabelPorId.values());
    const labelsFaltando = LABELS_ESPERADOS.filter(
      (l) => !labelsEncontrados.has(l),
    );
    if (labelsFaltando.length > 0) {
      throw new Error(
        `NivelCompartilhamento sem os labels esperados: ${labelsFaltando.join(
          ', ',
        )}. Verifique o seed.`,
      );
    }

    const camadasAdicionaisSint = camadasAdicionais.map((v) => ({
      COD_GRUPO_ID: v.COD_GRUPO_ID,
      COD_NIVEL_COMPATILHAMENTO: v.camada.COD_NIVEL_COMPATILHAMENTO,
      _count: { _all: 1 },
    }));
    const rastersAdicionaisSint = rastersAdicionais.map((v) => ({
      COD_GRUPO_ID: v.COD_GRUPO_ID,
      COD_NIVEL_COMPATILHAMENTO: v.camadaRaster.COD_NIVEL_COMPATILHAMENTO,
      _count: { _all: 1 },
    }));
    const mapasAdicionaisSint = mapasAdicionais.map((v) => ({
      COD_GRUPO_ID: v.COD_GRUPO_ID,
      COD_NIVEL_COMPATILHAMENTO: v.mapa.COD_NIVEL_COMPATILHAMENTO,
      _count: { _all: 1 },
    }));

    const [
      camadasPrivadoCriador,
      rastersPrivadoCriador,
      mapasPrivadoCriador,
      camadasAdicionaisPrivadoCriador,
      rastersAdicionaisPrivadoCriador,
      mapasAdicionaisPrivadoCriador,
    ] = userId
      ? await Promise.all([
          this.prisma.camadas.groupBy({
            by: ['COD_GRUPO_ID'],
            where: {
              DHS_EXCLUSAO: null,
              COD_USUARIO_CRIACAO: userId,
              COD_NIVEL_COMPATILHAMENTO: privadoId,
            },
            _count: { _all: true },
          }),
          this.prisma.camadasRaster.groupBy({
            by: ['COD_GRUPO_ID'],
            where: {
              DHS_EXCLUSAO: null,
              COD_USUARIO_CRIACAO: userId,
              COD_NIVEL_COMPATILHAMENTO: privadoId,
            },
            _count: { _all: true },
          }),
          this.prisma.mapas.groupBy({
            by: ['COD_GRUPO_ID'],
            where: {
              DHS_EXCLUSAO: null,
              COD_USUARIO_CRIACAO: userId,
              COD_NIVEL_COMPATILHAMENTO: privadoId,
            },
            _count: { _all: true },
          }),
          this.prisma.camadaGrupoAdicional.findMany({
            where: {
              camada: {
                DHS_EXCLUSAO: null,
                COD_USUARIO_CRIACAO: userId,
                COD_NIVEL_COMPATILHAMENTO: privadoId,
              },
            },
            select: { COD_GRUPO_ID: true },
          }),
          this.prisma.camadaRasterGrupoAdicional.findMany({
            where: {
              camadaRaster: {
                DHS_EXCLUSAO: null,
                COD_USUARIO_CRIACAO: userId,
                COD_NIVEL_COMPATILHAMENTO: privadoId,
              },
            },
            select: { COD_GRUPO_ID: true },
          }),
          this.prisma.mapaGrupoAdicional.findMany({
            where: {
              mapa: {
                DHS_EXCLUSAO: null,
                COD_USUARIO_CRIACAO: userId,
                COD_NIVEL_COMPATILHAMENTO: privadoId,
              },
            },
            select: { COD_GRUPO_ID: true },
          }),
        ])
      : [[], [], [], [], [], []];

    const somaPorGrupo = new Map<string, number>();
    const publicoPorGrupo = new Map<string, number>();
    const institucionalPorGrupo = new Map<string, number>();
    const privadoTotalPorGrupo = new Map<string, number>();

    for (const lista of [
      camadasPorNivel,
      rastersPorNivel,
      mapasPorNivel,
      camadasAdicionaisSint,
      rastersAdicionaisSint,
      mapasAdicionaisSint,
    ]) {
      for (const linha of lista) {
        const label =
          nivelLabelPorId.get(linha.COD_NIVEL_COMPATILHAMENTO) ?? '';
        const qtd = linha._count._all;
        somaPorGrupo.set(
          linha.COD_GRUPO_ID,
          (somaPorGrupo.get(linha.COD_GRUPO_ID) ?? 0) + qtd,
        );
        if (label === 'Público') {
          publicoPorGrupo.set(
            linha.COD_GRUPO_ID,
            (publicoPorGrupo.get(linha.COD_GRUPO_ID) ?? 0) + qtd,
          );
        } else if (label === 'Institucional') {
          institucionalPorGrupo.set(
            linha.COD_GRUPO_ID,
            (institucionalPorGrupo.get(linha.COD_GRUPO_ID) ?? 0) + qtd,
          );
        } else if (label === 'Privado') {
          privadoTotalPorGrupo.set(
            linha.COD_GRUPO_ID,
            (privadoTotalPorGrupo.get(linha.COD_GRUPO_ID) ?? 0) + qtd,
          );
        }
      }
    }

    const camadasAdicionaisPrivadoCriadorSint =
      camadasAdicionaisPrivadoCriador.map((v) => ({
        COD_GRUPO_ID: v.COD_GRUPO_ID,
        _count: { _all: 1 },
      }));
    const rastersAdicionaisPrivadoCriadorSint =
      rastersAdicionaisPrivadoCriador.map((v) => ({
        COD_GRUPO_ID: v.COD_GRUPO_ID,
        _count: { _all: 1 },
      }));
    const mapasAdicionaisPrivadoCriadorSint = mapasAdicionaisPrivadoCriador.map(
      (v) => ({
        COD_GRUPO_ID: v.COD_GRUPO_ID,
        _count: { _all: 1 },
      }),
    );

    const privadoCriadorPorGrupo = new Map<string, number>();
    for (const lista of [
      camadasPrivadoCriador,
      rastersPrivadoCriador,
      mapasPrivadoCriador,
      camadasAdicionaisPrivadoCriadorSint,
      rastersAdicionaisPrivadoCriadorSint,
      mapasAdicionaisPrivadoCriadorSint,
    ]) {
      for (const linha of lista) {
        privadoCriadorPorGrupo.set(
          linha.COD_GRUPO_ID,
          (privadoCriadorPorGrupo.get(linha.COD_GRUPO_ID) ?? 0) +
            linha._count._all,
        );
      }
    }

    const membrosPorGrupo = new Map(
      membros.map((m) => [m.COD_GRUPO_ID, m._count._all] as const),
    );

    return grupos.map((raw) => ({
      grupo: PrismaGrupoMapper.toDomain(raw),
      temaNome: raw.temas.NOM_NOME_TEMA,
      qtdItens: somaPorGrupo.get(raw.COD_GRUPO_ID) ?? 0,
      qtdMembros: membrosPorGrupo.get(raw.COD_GRUPO_ID) ?? 0,
      qtdItensPublico: publicoPorGrupo.get(raw.COD_GRUPO_ID) ?? 0,
      qtdItensInstitucional: institucionalPorGrupo.get(raw.COD_GRUPO_ID) ?? 0,
      qtdItensPrivadoTotal: privadoTotalPorGrupo.get(raw.COD_GRUPO_ID) ?? 0,
      qtdItensPrivadoCriador: privadoCriadorPorGrupo.get(raw.COD_GRUPO_ID) ?? 0,
    }));
  }

  async create(grupoCamada: Grupo): Promise<void> {
    const data = PrismaGrupoMapper.toPrisma(grupoCamada);

    await this.prisma.grupo.create({
      data,
    });
  }

  async save(grupo: Grupo): Promise<void> {
    const data = PrismaGrupoMapper.toPrisma(grupo);

    await Promise.all([
      this.prisma.grupo.update({
        where: {
          COD_GRUPO_ID: grupo.id.toString(),
        },
        data,
      }),
    ]);
  }

  async delete(
    COD_GRUPO_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.grupo.update({
        where: {
          COD_GRUPO_ID,
        },
        data: {
          DHS_EXCLUSAO: new Date(),
          COD_USUARIO_EXCLUSAO: COD_USUARIO_EXCLUSAO,
        },
      }),
      this.prisma.camadaGrupoAdicional.deleteMany({
        where: { COD_GRUPO_ID },
      }),
      this.prisma.camadaRasterGrupoAdicional.deleteMany({
        where: { COD_GRUPO_ID },
      }),
      this.prisma.mapaGrupoAdicional.deleteMany({
        where: { COD_GRUPO_ID },
      }),
    ]);
  }

  async countByGruposId(COD_GRUPO_ID: string): Promise<number> {
    const [camadas, rasters, mapas] = await Promise.all([
      this.prisma.camadas.count({
        where: { COD_GRUPO_ID, DHS_EXCLUSAO: null },
      }),
      this.prisma.camadasRaster.count({
        where: { COD_GRUPO_ID, DHS_EXCLUSAO: null },
      }),
      this.prisma.mapas.count({
        where: { COD_GRUPO_ID, DHS_EXCLUSAO: null },
      }),
    ]);

    return camadas + rasters + mapas;
  }

  async moveItensDoGrupo(
    grupoOrigemId: string,
    grupoDestinoId: string,
  ): Promise<number> {
    const [camadas, rasters, mapas] = await this.prisma.$transaction([
      this.prisma.camadas.updateMany({
        where: { COD_GRUPO_ID: grupoOrigemId, DHS_EXCLUSAO: null },
        data: { COD_GRUPO_ID: grupoDestinoId },
      }),
      this.prisma.camadasRaster.updateMany({
        where: { COD_GRUPO_ID: grupoOrigemId, DHS_EXCLUSAO: null },
        data: { COD_GRUPO_ID: grupoDestinoId },
      }),
      this.prisma.mapas.updateMany({
        where: { COD_GRUPO_ID: grupoOrigemId, DHS_EXCLUSAO: null },
        data: { COD_GRUPO_ID: grupoDestinoId },
      }),
    ]);

    return camadas.count + rasters.count + mapas.count;
  }
}
