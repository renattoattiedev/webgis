import { describe, it, expect, beforeEach } from 'vitest';
import { GrupoAccessPolicy } from './grupo-access-policy';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { GrupoMembro } from '@/domain/manager/enterprise/entities/grupo-membro';
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

function makeMembro(
  grupoId: string,
  userId: string,
  status: 'membro' | 'pendente' = 'membro',
) {
  return GrupoMembro.create({
    COD_GRUPO_ID: grupoId,
    COD_USER_ID: userId,
    DSC_STATUS: status,
    USUARIO_CRIACAO: 'dono-1',
    DHS_INCLUSAO: new Date(),
  });
}

describe('GrupoAccessPolicy', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let sut: GrupoAccessPolicy;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    sut = new GrupoAccessPolicy(grupoRepo, membrosRepo);
  });

  it('grupo "organizacao": institucional visivel para logado nao-membro', async () => {
    const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'organizacao' });
    grupoRepo.itens.push(grupo);
    const ctx = await sut.buildContext('user-1', 'Editor');
    expect(sut.canViewInstitucional(ctx, grupo)).toBe(true);
    expect(sut.canViewGrupo(ctx, grupo)).toBe(true);
  });

  it('grupo "membros": institucional oculto para nao-membro e visivel para membro', async () => {
    const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
    grupoRepo.itens.push(grupo);
    membrosRepo.itens.push(makeMembro('g1', 'membro-1'));

    const ctxForasteiro = await sut.buildContext('user-1', 'Editor');
    expect(sut.canViewInstitucional(ctxForasteiro, grupo)).toBe(false);
    expect(sut.canViewGrupo(ctxForasteiro, grupo)).toBe(false);

    const ctxMembro = await sut.buildContext('membro-1', 'Editor');
    expect(sut.canViewInstitucional(ctxMembro, grupo)).toBe(true);
    expect(sut.canViewGrupo(ctxMembro, grupo)).toBe(true);
  });

  it('vinculo "pendente" nao conta como membro', async () => {
    const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
    grupoRepo.itens.push(grupo);
    membrosRepo.itens.push(makeMembro('g1', 'user-1', 'pendente'));
    const ctx = await sut.buildContext('user-1', 'Editor');
    expect(sut.canViewInstitucional(ctx, grupo)).toBe(false);
  });

  it('dono e Admin sempre veem, mesmo grupo "membros"', async () => {
    const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
    grupoRepo.itens.push(grupo);

    const ctxDono = await sut.buildContext('dono-1', 'Editor');
    expect(sut.canViewInstitucional(ctxDono, grupo)).toBe(true);

    const ctxAdmin = await sut.buildContext('outro', 'Admin');
    expect(sut.canViewInstitucional(ctxAdmin, grupo)).toBe(true);
  });

  it('anonimo nunca ve institucional', async () => {
    const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'organizacao' });
    grupoRepo.itens.push(grupo);
    const ctx = await sut.buildContext(null, null);
    expect(sut.canViewInstitucional(ctx, grupo)).toBe(false);
  });

  it('edicao: criador do item, dono do grupo e Admin podem; membro comum nao', async () => {
    const grupo = makeGrupo('g1', { BOL_MEMBROS_CONTRIBUEM: false });
    grupoRepo.itens.push(grupo);
    membrosRepo.itens.push(makeMembro('g1', 'membro-1'));

    const ctxCriador = await sut.buildContext('criador-item', 'Publicador');
    expect(sut.canEditGroupContent(ctxCriador, grupo, 'criador-item')).toBe(
      true,
    );

    const ctxDono = await sut.buildContext('dono-1', 'Publicador');
    expect(sut.canEditGroupContent(ctxDono, grupo, 'criador-item')).toBe(true);

    const ctxAdmin = await sut.buildContext('outro', 'Admin');
    expect(sut.canEditGroupContent(ctxAdmin, grupo, 'criador-item')).toBe(true);

    const ctxMembro = await sut.buildContext('membro-1', 'Publicador');
    expect(sut.canEditGroupContent(ctxMembro, grupo, 'criador-item')).toBe(
      false,
    );
  });

  it('edicao: membro pode quando BOL_MEMBROS_CONTRIBUEM', async () => {
    const grupo = makeGrupo('g1', { BOL_MEMBROS_CONTRIBUEM: true });
    grupoRepo.itens.push(grupo);
    membrosRepo.itens.push(makeMembro('g1', 'membro-1'));
    const ctx = await sut.buildContext('membro-1', 'Publicador');
    expect(sut.canEditGroupContent(ctx, grupo, 'criador-item')).toBe(true);
  });

  it('canManageGrupo: apenas dono e Admin', async () => {
    const grupo = makeGrupo('g1');
    grupoRepo.itens.push(grupo);
    membrosRepo.itens.push(makeMembro('g1', 'membro-1'));

    expect(
      sut.canManageGrupo(await sut.buildContext('dono-1', 'Editor'), grupo),
    ).toBe(true);
    expect(
      sut.canManageGrupo(await sut.buildContext('x', 'Admin'), grupo),
    ).toBe(true);
    expect(
      sut.canManageGrupo(await sut.buildContext('membro-1', 'Editor'), grupo),
    ).toBe(false);
  });

  it('canViewInstitucionalByGrupoId usa o mapa de grupos do contexto', async () => {
    const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
    grupoRepo.itens.push(grupo);
    const ctx = await sut.buildContext('user-1', 'Editor');
    expect(sut.canViewInstitucionalByGrupoId(ctx, 'g1')).toBe(false);
    expect(sut.canViewInstitucionalByGrupoId(ctx, 'inexistente')).toBe(false);
  });

  describe('canViewInstitucionalForGrupo', () => {
    it('anonimo nunca ve institucional', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'organizacao' });
      grupoRepo.itens.push(grupo);
      expect(await sut.canViewInstitucionalForGrupo(null, null, 'g1')).toBe(
        false,
      );
    });

    it('Admin sempre ve, mesmo grupo inexistente', async () => {
      expect(
        await sut.canViewInstitucionalForGrupo(
          'user-1',
          'Admin',
          'inexistente',
        ),
      ).toBe(true);
    });

    it('grupo "membros": membro ativo ve, nao-membro nao ve', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);
      membrosRepo.itens.push(makeMembro('g1', 'membro-1'));

      expect(
        await sut.canViewInstitucionalForGrupo('membro-1', 'Editor', 'g1'),
      ).toBe(true);
      expect(
        await sut.canViewInstitucionalForGrupo('user-1', 'Editor', 'g1'),
      ).toBe(false);
    });

    it('grupo "organizacao": nao-membro logado ve', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'organizacao' });
      grupoRepo.itens.push(grupo);
      expect(
        await sut.canViewInstitucionalForGrupo('user-1', 'Editor', 'g1'),
      ).toBe(true);
    });

    it('dono ve institucional de grupo "membros"', async () => {
      const grupo = makeGrupo('g1', {
        USUARIO_DONO: 'dono-1',
        DSC_VISIBILIDADE: 'membros',
      });
      grupoRepo.itens.push(grupo);
      expect(
        await sut.canViewInstitucionalForGrupo('dono-1', 'Editor', 'g1'),
      ).toBe(true);
    });

    it('vinculo soft-deletado nao conta como membro', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);
      const membro = makeMembro('g1', 'user-1');
      membro.excluir('dono-1');
      membrosRepo.itens.push(membro);
      expect(
        await sut.canViewInstitucionalForGrupo('user-1', 'Editor', 'g1'),
      ).toBe(false);
    });

    it('vinculo "pendente" nao conta como membro', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);
      membrosRepo.itens.push(makeMembro('g1', 'user-1', 'pendente'));
      expect(
        await sut.canViewInstitucionalForGrupo('user-1', 'Editor', 'g1'),
      ).toBe(false);
    });
  });

  describe('canViewItemByNivel', () => {
    it('Público sempre visível, mesmo anônimo', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext(null, null);
      expect(
        sut.canViewItemByNivel(ctx, 'Público', 'g1', 'qualquer-criador'),
      ).toBe(true);
    });

    it('Institucional delega para canViewInstitucionalByGrupoId', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);

      const ctxForasteiro = await sut.buildContext('user-1', 'Editor');
      expect(
        sut.canViewItemByNivel(
          ctxForasteiro,
          'Institucional',
          'g1',
          'criador-1',
        ),
      ).toBe(false);

      const ctxDono = await sut.buildContext('dono-1', 'Editor');
      expect(
        sut.canViewItemByNivel(ctxDono, 'Institucional', 'g1', 'criador-1'),
      ).toBe(true);
    });

    it('Privado visivel para o criador, oculto para outro logado', async () => {
      const grupo = makeGrupo('g1');
      grupoRepo.itens.push(grupo);

      const ctxCriador = await sut.buildContext('criador-item', 'Editor');
      expect(
        sut.canViewItemByNivel(ctxCriador, 'Privado', 'g1', 'criador-item'),
      ).toBe(true);

      const ctxOutro = await sut.buildContext('outro-user', 'Editor');
      expect(
        sut.canViewItemByNivel(ctxOutro, 'Privado', 'g1', 'criador-item'),
      ).toBe(false);
    });

    it('Privado visivel para Admin mesmo nao sendo criador', async () => {
      const grupo = makeGrupo('g1');
      grupoRepo.itens.push(grupo);
      const ctxAdmin = await sut.buildContext('admin-1', 'Admin');
      expect(
        sut.canViewItemByNivel(ctxAdmin, 'Privado', 'g1', 'criador-item'),
      ).toBe(true);
    });

    it('Privado nunca visivel para anonimo', async () => {
      const grupo = makeGrupo('g1');
      grupoRepo.itens.push(grupo);
      const ctxAnonimo = await sut.buildContext(null, null);
      expect(
        sut.canViewItemByNivel(ctxAnonimo, 'Privado', 'g1', 'criador-item'),
      ).toBe(false);
    });

    it('nivel desconhecido retorna false', async () => {
      const grupo = makeGrupo('g1');
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext('user-1', 'Editor');
      expect(sut.canViewItemByNivel(ctx, '', 'g1', 'criador-item')).toBe(false);
    });
  });

  describe('contarItensVisiveis', () => {
    const contagens = {
      publico: 3,
      institucional: 5,
      privadoTotal: 8,
      privadoCriador: 2,
    };

    it('nao-membro em grupo organizacao: publico + institucional + privado proprio', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'organizacao' });
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext('user-1', 'Editor');
      expect(sut.contarItensVisiveis(ctx, grupo, contagens)).toBe(3 + 5 + 2);
    });

    it('nao-membro em grupo membros: institucional nao soma', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext('user-1', 'Editor');
      expect(sut.contarItensVisiveis(ctx, grupo, contagens)).toBe(3 + 0 + 2);
    });

    it('Admin: privado total em vez de privado proprio', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext('admin-1', 'Admin');
      expect(sut.contarItensVisiveis(ctx, grupo, contagens)).toBe(3 + 5 + 8);
    });

    it('anonimo: so publico', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'organizacao' });
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext(null, null);
      expect(
        sut.contarItensVisiveis(ctx, grupo, {
          ...contagens,
          privadoCriador: 0,
        }),
      ).toBe(3);
    });

    it('membro explicito de grupo membros: institucional soma', async () => {
      const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
      grupoRepo.itens.push(grupo);
      membrosRepo.itens.push(makeMembro('g1', 'user-1'));
      const ctx = await sut.buildContext('user-1', 'Editor');
      expect(sut.contarItensVisiveis(ctx, grupo, contagens)).toBe(3 + 5 + 2);
    });
  });

  describe('canAssignToGrupo', () => {
    it('Admin sempre pode atribuir, mesmo sem ser membro', async () => {
      const grupo = makeGrupo('g1');
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext('admin-1', 'Admin');
      expect(sut.canAssignToGrupo(ctx, 'g1')).toBe(true);
    });

    it('Publicador dono do grupo pode atribuir', async () => {
      const grupo = makeGrupo('g1', { USUARIO_DONO: 'user-1' });
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext('user-1', 'Publicador');
      expect(sut.canAssignToGrupo(ctx, 'g1')).toBe(true);
    });

    it('Publicador membro pode atribuir', async () => {
      const grupo = makeGrupo('g1');
      grupoRepo.itens.push(grupo);
      membrosRepo.itens.push(makeMembro('g1', 'user-1'));
      const ctx = await sut.buildContext('user-1', 'Publicador');
      expect(sut.canAssignToGrupo(ctx, 'g1')).toBe(true);
    });

    it('Publicador nao-membro nao pode atribuir', async () => {
      const grupo = makeGrupo('g1');
      grupoRepo.itens.push(grupo);
      const ctx = await sut.buildContext('user-1', 'Publicador');
      expect(sut.canAssignToGrupo(ctx, 'g1')).toBe(false);
    });

    it('grupo inexistente retorna false para nao-Admin', async () => {
      const ctx = await sut.buildContext('user-1', 'Publicador');
      expect(sut.canAssignToGrupo(ctx, 'grupo-inexistente')).toBe(false);
    });
  });
});
