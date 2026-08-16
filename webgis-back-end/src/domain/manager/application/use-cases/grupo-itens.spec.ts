import { describe, it, expect, beforeEach } from 'vitest';
import { AddItemToGrupoUseCase } from './add-item-to-grupo';
import { RemoveItemFromGrupoUseCase } from './remove-item-from-grupo';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { InMemoryGrupoItensAdicionaisRepository } from '../../../../../test/repositories/in-memory-grupo-itens-adicionais-repository';
import { InMemoryCamadasRepository } from '../../../../../test/repositories/in-memory-camadas-repository';
import { InMemoryCamadasRasterRepository } from '../../../../../test/repositories/in-memory-camadas-raster-repository';
import { InMemoryMapasRepository } from '../../../../../test/repositories/in-memory-mapas-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { GrupoMembro } from '@/domain/manager/enterprise/entities/grupo-membro';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

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

describe('AddItemToGrupoUseCase / RemoveItemFromGrupoUseCase', () => {
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
    camadasRepo.itens.push(makeCamada('camada-1', { GRUPOS_CAMADAS: 'g1' }));
  });

  function sutAdd() {
    return new AddItemToGrupoUseCase(
      camadasRepo,
      camadasRasterRepo,
      mapasRepo,
      policy,
      itensAdicionaisRepo,
    );
  }

  function sutRemove() {
    return new RemoveItemFromGrupoUseCase(
      camadasRepo,
      camadasRasterRepo,
      mapasRepo,
      policy,
      itensAdicionaisRepo,
    );
  }

  describe('AddItemToGrupoUseCase', () => {
    it('dono do grupo alvo e criador do item vincula com sucesso', async () => {
      const result = await sutAdd().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'dono-1',
        perfilRequester: 'Editor',
      });
      expect(result.isRight()).toBe(true);
      expect(
        await itensAdicionaisRepo.existsVinculo('camada', 'camada-1', 'g2'),
      ).toBe(true);
    });

    it('Admin sempre pode vincular', async () => {
      const result = await sutAdd().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'qualquer-um',
        perfilRequester: 'Admin',
      });
      expect(result.isRight()).toBe(true);
    });

    it('nao-membro do grupo alvo nao pode vincular', async () => {
      const result = await sutAdd().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'criador-item',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });

    it('membro do grupo alvo mas sem permissao de editar o item nao pode vincular', async () => {
      membrosRepo.itens.push(
        GrupoMembro.create({
          COD_GRUPO_ID: 'g2',
          COD_USER_ID: 'estranho',
          DSC_STATUS: 'membro',
          USUARIO_CRIACAO: 'dono-1',
          DHS_INCLUSAO: new Date(),
        }),
      );
      const result = await sutAdd().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'estranho',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });

    it('item ja vinculado ao grupo (primario) e rejeitado', async () => {
      const result = await sutAdd().execute({
        grupoId: 'g1',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'dono-1',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });

    it('item ja vinculado ao grupo (adicional) e rejeitado', async () => {
      await itensAdicionaisRepo.create('camada', 'camada-1', 'g2');
      const result = await sutAdd().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'dono-1',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });

    it('item inexistente retorna ResourceNotFoundError', async () => {
      const result = await sutAdd().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'nao-existe',
        requesterId: 'dono-1',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    });
  });

  describe('RemoveItemFromGrupoUseCase', () => {
    it('remove vinculo adicional com sucesso', async () => {
      await itensAdicionaisRepo.create('camada', 'camada-1', 'g2');
      const result = await sutRemove().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'dono-1',
        perfilRequester: 'Editor',
      });
      expect(result.isRight()).toBe(true);
      expect(
        await itensAdicionaisRepo.existsVinculo('camada', 'camada-1', 'g2'),
      ).toBe(false);
    });

    it('nao remove o vinculo primario', async () => {
      const result = await sutRemove().execute({
        grupoId: 'g1',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'dono-1',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });

    it('vinculo inexistente retorna ResourceNotFoundError', async () => {
      const result = await sutRemove().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'dono-1',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    });

    it('nao-membro do grupo alvo nao pode remover', async () => {
      await itensAdicionaisRepo.create('camada', 'camada-1', 'g2');
      const result = await sutRemove().execute({
        grupoId: 'g2',
        tipo: 'camada',
        itemId: 'camada-1',
        requesterId: 'criador-item',
        perfilRequester: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });
  });
});
