import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FetchContentGrupoController } from './fetch-content-grupo.controller';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { right } from '@/core/either';

/**
 * Regression test for the "Privado" mapa leak fixed in this controller
 * (Pattern B, see fetch-content-organization.controller.spec.ts): no
 * AppModule bootstrap; the controller is instantiated directly with its
 * 10 injected use-cases mocked via vi.fn(). `grupoAccessPolicy` here is a
 * plain mock mirroring `GrupoAccessPolicy.canViewItemByNivel`'s Privado
 * rule (creator or Admin), since this controller now delegates to it
 * instead of a local switch that lacked the Admin bypass.
 */
function makeMapaPrivado(criador: string) {
  return Mapas.create(
    {
      GRUPOS_MAPAS: 'grupo-1',
      NIVEL_COMPATILHAMENTO: 'nivel-privado',
      NOM_NOME_MAPA: 'mapa',
      DSC_TITULO: 'Mapa',
      DSC_DESCRICAO: 'desc',
      USUARIO_CRIACAO: criador,
      DHS_INCLUSAO: new Date(),
      CAMADAS: [],
      CAMADAS_RASTER: [],
    },
    new UniqueEntityID('mapa-1'),
  );
}

describe('FetchContentGrupoController — filtro de mapa Privado', () => {
  let controller: FetchContentGrupoController;
  let fetchCamadasGrupo: { execute: ReturnType<typeof vi.fn> };
  let fetchCamadasRasterGrupoUseCase: { execute: ReturnType<typeof vi.fn> };
  let fetchMapasGrupo: { execute: ReturnType<typeof vi.fn> };
  let fetchPacotesConceituais: { execute: ReturnType<typeof vi.fn> };
  let fetchGrupo: { execute: ReturnType<typeof vi.fn> };
  let getUsuario: { execute: ReturnType<typeof vi.fn> };
  let fetchNivelCompartilhamento: { execute: ReturnType<typeof vi.fn> };
  let fetchTemasId: { execute: ReturnType<typeof vi.fn> };
  let grupoAccessPolicy: {
    buildContext: ReturnType<typeof vi.fn>;
    canViewItemByNivel: ReturnType<typeof vi.fn>;
    canEditGroupContentByGrupoId: ReturnType<typeof vi.fn>;
  };
  let getUserPerfilUseCase: { execute: ReturnType<typeof vi.fn> };
  let grupoItensAdicionaisRepository: {
    findGrupoIdsByItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    fetchCamadasGrupo = {
      execute: vi.fn().mockResolvedValue(right({ camadas: [] })),
    };
    fetchCamadasRasterGrupoUseCase = {
      execute: vi.fn().mockResolvedValue(right({ camadasRaster: [] })),
    };
    fetchMapasGrupo = { execute: vi.fn() };
    fetchPacotesConceituais = {
      execute: vi
        .fn()
        .mockResolvedValue(
          right({ pacotesConceituais: { pacoteConceitualNome: 'Pacote' } }),
        ),
    };
    fetchGrupo = {
      execute: vi
        .fn()
        .mockResolvedValue(
          right({ grupo: [{ grupoTema: 'tema-1', grupoNome: 'Grupo Teste' }] }),
        ),
    };
    getUsuario = {
      execute: vi
        .fn()
        .mockResolvedValue(right({ user: { userNome: 'Usuário' } })),
    };
    fetchNivelCompartilhamento = {
      execute: vi.fn().mockResolvedValue(
        right({
          nivelCompartilhamento: { nivelCompartilhamentoDescricao: 'Privado' },
        }),
      ),
    };
    fetchTemasId = {
      execute: vi
        .fn()
        .mockResolvedValue(right({ temas: [{ temaNome: 'Tema' }] })),
    };
    grupoAccessPolicy = {
      buildContext: vi.fn().mockImplementation(async (userId, perfil) => ({
        userId,
        isAdmin: perfil === 'Admin',
        gruposMembro: new Set(),
        grupos: new Map(),
      })),
      canViewItemByNivel: vi
        .fn()
        .mockImplementation((ctx, nivel, _grupoId, idUsrCriacao) => {
          switch (nivel) {
            case 'Público':
              return true;
            case 'Institucional':
              return false;
            case 'Privado':
              return (
                ctx.isAdmin ||
                (ctx.userId !== null && ctx.userId === idUsrCriacao)
              );
            default:
              return false;
          }
        }),
      // Espelha `GrupoAccessPolicy.canEditGroupContentByGrupoId`, usado pelo
      // controller para calcular `podeEditar` de cada item.
      canEditGroupContentByGrupoId: vi
        .fn()
        .mockImplementation((ctx, grupoId, itemCreatorId) => {
          const grupo = ctx.grupos.get(grupoId);
          if (!grupo) return ctx.isAdmin;
          if (ctx.isAdmin) return true;
          if (!ctx.userId) return false;
          if (grupo.grupoDono === ctx.userId) return true;
          if (itemCreatorId === ctx.userId) return true;
          return grupo.grupoMembrosContribuem && ctx.gruposMembro.has(grupoId);
        }),
    };
    getUserPerfilUseCase = {
      execute: vi.fn().mockResolvedValue(right({ userPerfil: 'Editor' })),
    };
    grupoItensAdicionaisRepository = {
      findGrupoIdsByItem: vi.fn().mockResolvedValue([]),
    };

    controller = new FetchContentGrupoController(
      fetchCamadasGrupo as any,
      fetchCamadasRasterGrupoUseCase as any,
      fetchMapasGrupo as any,
      fetchPacotesConceituais as any,
      fetchGrupo as any,
      getUsuario as any,
      fetchNivelCompartilhamento as any,
      fetchTemasId as any,
      grupoAccessPolicy as any,
      getUserPerfilUseCase as any,
      grupoItensAdicionaisRepository as any,
    );
  });

  it('inclui mapa Privado do proprio criador (regressao: idUsrCriacao faltava em enrichMapas)', async () => {
    fetchMapasGrupo.execute.mockResolvedValue(
      right({ mapas: [makeMapaPrivado('user-1')] }),
    );

    const result = await controller.handle('grupo-1', {
      sub: 'user-1',
    } as any);

    expect(result.mapas).toHaveLength(1);
  });

  it('exclui mapa Privado de outro usuario', async () => {
    fetchMapasGrupo.execute.mockResolvedValue(
      right({ mapas: [makeMapaPrivado('outro-usuario')] }),
    );

    const result = await controller.handle('grupo-1', {
      sub: 'user-1',
    } as any);

    expect(result.mapas).toHaveLength(0);
  });

  it('Admin ve mapa Privado de outro usuario (regressao bug: Admin nao via mapa Privado do grupo)', async () => {
    getUserPerfilUseCase.execute.mockResolvedValue(
      right({ userPerfil: 'Admin' }),
    );
    fetchMapasGrupo.execute.mockResolvedValue(
      right({ mapas: [makeMapaPrivado('outro-usuario')] }),
    );

    const result = await controller.handle('grupo-1', {
      sub: 'admin-1',
    } as any);

    expect(result.mapas).toHaveLength(1);
  });
});
