import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FetchContentOrganizationController } from './fetch-content-organization.controller';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { InMemoryGrupoRepository } from '../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../test/repositories/in-memory-grupo-membros-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { right } from '@/core/either';

/**
 * Regression tests for the "Privado" leak fixed in this controller.
 *
 * NOTE (Pattern B, see raster-files-tree.controller.spec.ts): no AppModule
 * bootstrap; the controller is instantiated directly with its 13 injected
 * use-cases mocked via vi.fn(). The exception is GrupoAccessPolicy, which is
 * instantiated for real (backed by in-memory repositories) so these tests
 * actually exercise the nivel-visibility checks — including the
 * `idUsrCriacao` wiring on mapas that was missing and caused the leak.
 */
function makeGrupo() {
  return Grupo.create(
    {
      NOM_NOME_GRUPO: 'Grupo Teste',
      SGL_GRUPO_ID: 'GT',
      USUARIO_CRIACAO: 'dono-1',
      COD_TEMA_ID: 'tema-1',
      DHS_INCLUSAO: new Date(),
      USUARIO_ALTERACAO: null,
      USUARIO_DONO: 'dono-1',
      DSC_VISIBILIDADE: 'organizacao',
      DSC_POLITICA_PARTICIPACAO: 'convite',
      BOL_MEMBROS_CONTRIBUEM: false,
    },
    new UniqueEntityID('grupo-1'),
  );
}

function makeCamadaPrivada(criador: string) {
  return Camadas.create(
    {
      NOM_NOME: 'camada',
      DSC_TITULO: 'Camada',
      DSC_DESCRICAO: 'desc',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'nivel-privado',
      GRUPOS_CAMADAS: 'grupo-1',
      TXT_TAGS: '',
      PACOTES_CONCEITUAIS: 'pacote-1',
      DSC_FONTE_DADOS_CAMADA: '',
      USUARIO_CRIACAO: criador,
      DHS_INCLUSAO: new Date(),
      FLG_CAMADA_ATIVA: true,
    },
    new UniqueEntityID('camada-1'),
  );
}

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

describe('FetchContentOrganizationController — filtro de nivel Privado', () => {
  let controller: FetchContentOrganizationController;
  let fetchContentOrganizationUseCase: {
    executeMany: ReturnType<typeof vi.fn>;
  };
  let fetchPacotesConceituais: { execute: ReturnType<typeof vi.fn> };
  let fetchGrupo: { execute: ReturnType<typeof vi.fn> };
  let getUsuario: { execute: ReturnType<typeof vi.fn> };
  let fetchNivelCompartilhamento: { execute: ReturnType<typeof vi.fn> };
  let fetchTemasId: { execute: ReturnType<typeof vi.fn> };
  let checkCamadaFavoritaUseCase: { execute: ReturnType<typeof vi.fn> };
  let checkCamadaRasterFavoritaUseCase: { execute: ReturnType<typeof vi.fn> };
  let checkMapaFavoritoUseCase: { execute: ReturnType<typeof vi.fn> };
  let getOrdemCamadaRasterUseCase: { execute: ReturnType<typeof vi.fn> };
  let getOrdemCamadaUseCase: { execute: ReturnType<typeof vi.fn> };
  let grupoAccessPolicy: GrupoAccessPolicy;
  let getUserPerfilUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const grupoRepo = new InMemoryGrupoRepository();
    grupoRepo.itens.push(makeGrupo());
    grupoAccessPolicy = new GrupoAccessPolicy(
      grupoRepo,
      new InMemoryGrupoMembrosRepository(),
    );

    fetchContentOrganizationUseCase = { executeMany: vi.fn() };
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
    checkCamadaFavoritaUseCase = {
      execute: vi.fn().mockResolvedValue(right({ favorito: false })),
    };
    checkCamadaRasterFavoritaUseCase = {
      execute: vi.fn().mockResolvedValue(right({ favorito: false })),
    };
    checkMapaFavoritoUseCase = {
      execute: vi.fn().mockResolvedValue(right({ favorito: false })),
    };
    getOrdemCamadaRasterUseCase = {
      execute: vi.fn().mockResolvedValue(right({ ordem: 0 })),
    };
    getOrdemCamadaUseCase = {
      execute: vi.fn().mockResolvedValue(right({ ordem: 0 })),
    };
    getUserPerfilUseCase = {
      execute: vi.fn().mockResolvedValue(right({ userPerfil: 'Editor' })),
    };

    controller = new FetchContentOrganizationController(
      fetchContentOrganizationUseCase as any,
      fetchPacotesConceituais as any,
      fetchGrupo as any,
      getUsuario as any,
      fetchNivelCompartilhamento as any,
      fetchTemasId as any,
      checkCamadaFavoritaUseCase as any,
      checkCamadaRasterFavoritaUseCase as any,
      checkMapaFavoritoUseCase as any,
      getOrdemCamadaRasterUseCase as any,
      getOrdemCamadaUseCase as any,
      grupoAccessPolicy,
      getUserPerfilUseCase as any,
    );
  });

  it('exclui camada Privada de outro usuario', async () => {
    fetchContentOrganizationUseCase.executeMany.mockResolvedValue(
      right({
        camadas: [makeCamadaPrivada('outro-usuario')],
        camadasRaster: [],
        mapas: [],
      }),
    );

    const result = await controller.handle({ sub: 'user-1' } as any);

    expect(result.camadas).toHaveLength(0);
  });

  it('inclui camada Privada do proprio criador', async () => {
    fetchContentOrganizationUseCase.executeMany.mockResolvedValue(
      right({
        camadas: [makeCamadaPrivada('user-1')],
        camadasRaster: [],
        mapas: [],
      }),
    );

    const result = await controller.handle({ sub: 'user-1' } as any);

    expect(result.camadas).toHaveLength(1);
  });

  it('exclui mapa Privado de outro usuario (regressao: idUsrCriacao faltava em enrichMapa)', async () => {
    fetchContentOrganizationUseCase.executeMany.mockResolvedValue(
      right({
        camadas: [],
        camadasRaster: [],
        mapas: [makeMapaPrivado('outro-usuario')],
      }),
    );

    const result = await controller.handle({ sub: 'user-1' } as any);

    expect(result.mapas).toHaveLength(0);
  });

  it('inclui mapa Privado do proprio criador', async () => {
    fetchContentOrganizationUseCase.executeMany.mockResolvedValue(
      right({
        camadas: [],
        camadasRaster: [],
        mapas: [makeMapaPrivado('user-1')],
      }),
    );

    const result = await controller.handle({ sub: 'user-1' } as any);

    expect(result.mapas).toHaveLength(1);
  });
});
