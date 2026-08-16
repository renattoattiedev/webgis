import { describe, it, expect, beforeEach } from 'vitest';
import { GetItensDisponiveisGrupoUseCase } from './get-itens-disponiveis-grupo';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { InMemoryGrupoItensAdicionaisRepository } from '../../../../../test/repositories/in-memory-grupo-itens-adicionais-repository';
import { InMemoryCamadasRepository } from '../../../../../test/repositories/in-memory-camadas-repository';
import { InMemoryCamadasRasterRepository } from '../../../../../test/repositories/in-memory-camadas-raster-repository';
import { InMemoryMapasRepository } from '../../../../../test/repositories/in-memory-mapas-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

function makeGrupo(
  id: string,
  overrides: Partial<Parameters<typeof Grupo.create>[0]> = {},
) {
  return Grupo.create(
    {
      NOM_NOME_GRUPO: `Grupo ${id}`,
      SGL_GRUPO_ID: id.slice(0, 2).toUpperCase(),
      USUARIO_CRIACAO: 'criador-1',
      COD_TEMA_ID: 'tema-1',
      DHS_INCLUSAO: new Date(),
      USUARIO_ALTERACAO: null,
      USUARIO_DONO: 'dono-1',
      DSC_VISIBILIDADE: 'organizacao',
      DSC_POLITICA_PARTICIPACAO: 'convite',
      BOL_MEMBROS_CONTRIBUEM: false,
      ...overrides,
    },
    new UniqueEntityID(id),
  );
}

function makeCamada(
  id: string,
  overrides: Partial<Parameters<typeof Camadas.create>[0]> = {},
) {
  return Camadas.create(
    {
      NOM_NOME: `camada-${id}`,
      DSC_TITULO: `Camada ${id}`,
      DSC_DESCRICAO: 'descrição',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'nivel-1',
      GRUPOS_CAMADAS: 'g1',
      TXT_TAGS: '',
      PACOTES_CONCEITUAIS: 'pacote-1',
      DSC_FONTE_DADOS_CAMADA: '',
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: 'criador-item',
      FLG_CAMADA_ATIVA: true,
      ...overrides,
    },
    new UniqueEntityID(id),
  );
}

describe('GetItensDisponiveisGrupoUseCase', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let itensAdicionaisRepo: InMemoryGrupoItensAdicionaisRepository;
  let camadasRepo: InMemoryCamadasRepository;
  let camadasRasterRepo: InMemoryCamadasRasterRepository;
  let mapasRepo: InMemoryMapasRepository;
  let policy: GrupoAccessPolicy;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    itensAdicionaisRepo = new InMemoryGrupoItensAdicionaisRepository();
    camadasRepo = new InMemoryCamadasRepository();
    camadasRasterRepo = new InMemoryCamadasRasterRepository();
    mapasRepo = new InMemoryMapasRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);

    grupoRepo.itens.push(makeGrupo('g1'));
    grupoRepo.itens.push(makeGrupo('g2'));
  });

  function sut() {
    return new GetItensDisponiveisGrupoUseCase(
      camadasRepo,
      camadasRasterRepo,
      mapasRepo,
      policy,
      itensAdicionaisRepo,
    );
  }

  it('lista item cujo criador é o solicitante, exceto os já vinculados ao grupo alvo', async () => {
    camadasRepo.itens.push(
      makeCamada('camada-minha', {
        GRUPOS_CAMADAS: 'g1',
        USUARIO_CRIACAO: 'user-1',
      }),
    );
    camadasRepo.itens.push(
      makeCamada('camada-ja-primaria', {
        GRUPOS_CAMADAS: 'g2',
        USUARIO_CRIACAO: 'user-1',
      }),
    );

    const result = await sut().execute({
      grupoId: 'g2',
      requesterId: 'user-1',
      perfilRequester: 'Editor',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const ids = result.value.camadas.map((c) => c.id.toString());
      expect(ids).toContain('camada-minha');
      expect(ids).not.toContain('camada-ja-primaria');
    }
  });

  it('exclui item ja vinculado como adicional ao grupo alvo', async () => {
    camadasRepo.itens.push(
      makeCamada('camada-x', {
        GRUPOS_CAMADAS: 'g1',
        USUARIO_CRIACAO: 'user-1',
      }),
    );
    await itensAdicionaisRepo.create('camada', 'camada-x', 'g2');

    const result = await sut().execute({
      grupoId: 'g2',
      requesterId: 'user-1',
      perfilRequester: 'Editor',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const ids = result.value.camadas.map((c) => c.id.toString());
      expect(ids).not.toContain('camada-x');
    }
  });

  it('nao lista item de outro usuario em grupo do qual o solicitante nao e membro nem dono', async () => {
    camadasRepo.itens.push(
      makeCamada('camada-alheia', {
        GRUPOS_CAMADAS: 'g1',
        USUARIO_CRIACAO: 'outro-user',
      }),
    );

    const result = await sut().execute({
      grupoId: 'g2',
      requesterId: 'user-1',
      perfilRequester: 'Editor',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const ids = result.value.camadas.map((c) => c.id.toString());
      expect(ids).not.toContain('camada-alheia');
    }
  });

  it('Admin ve qualquer item editavel', async () => {
    camadasRepo.itens.push(
      makeCamada('camada-alheia-2', {
        GRUPOS_CAMADAS: 'g1',
        USUARIO_CRIACAO: 'outro-user',
      }),
    );

    const result = await sut().execute({
      grupoId: 'g2',
      requesterId: 'admin-1',
      perfilRequester: 'Admin',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const ids = result.value.camadas.map((c) => c.id.toString());
      expect(ids).toContain('camada-alheia-2');
    }
  });
});
