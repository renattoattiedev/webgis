import { describe, it, expect, beforeEach } from 'vitest';
import { FetchGruposOverviewUseCase } from './fetch-grupos-overview';
import { GetGrupoDetalheUseCase } from './get-grupo-detalhe';
import { UpdateGrupoConfigUseCase } from './update-grupo-config';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { GrupoMembro } from '@/domain/manager/enterprise/entities/grupo-membro';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

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

describe('overview, detalhe e config de grupos', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);
    grupoRepo.temas.set('tema-1', 'Saneamento');
  });

  it('overview: oculta grupo "membros" de nao-membros e marca membership', async () => {
    grupoRepo.itens.push(makeGrupo('aberto'));
    grupoRepo.itens.push(makeGrupo('fechado', { DSC_VISIBILIDADE: 'membros' }));
    membrosRepo.itens.push(makeMembro('fechado', 'user-1'));

    const sut = new FetchGruposOverviewUseCase(grupoRepo, membrosRepo, policy);

    const doUser = await sut.execute({
      COD_USER_ID: 'user-1',
      DSC_PERFIL: 'Editor',
    });
    expect(doUser.isRight()).toBe(true);
    if (doUser.isRight()) {
      expect(doUser.value.grupos).toHaveLength(2);
      const fechado = doUser.value.grupos.find(
        (g) => g.grupo.id.toString() === 'fechado',
      );
      expect(fechado?.membership).toBe('membro');
    }

    const doOutro = await sut.execute({
      COD_USER_ID: 'user-2',
      DSC_PERFIL: 'Editor',
    });
    if (doOutro.isRight()) {
      expect(doOutro.value.grupos).toHaveLength(1);
      expect(doOutro.value.grupos[0].grupo.id.toString()).toBe('aberto');
      expect(doOutro.value.grupos[0].membership).toBe(null);
    }
  });

  it('overview: dono aparece como membership "dono" e podeGerenciar', async () => {
    grupoRepo.itens.push(makeGrupo('g1'));
    const sut = new FetchGruposOverviewUseCase(grupoRepo, membrosRepo, policy);
    const result = await sut.execute({
      COD_USER_ID: 'dono-1',
      DSC_PERFIL: 'Editor',
    });
    if (result.isRight()) {
      expect(result.value.grupos[0].membership).toBe('dono');
      expect(result.value.grupos[0].podeGerenciar).toBe(true);
    }
  });

  it('detalhe: membros visiveis; pendentes so para gerenciador', async () => {
    grupoRepo.itens.push(makeGrupo('g1'));
    membrosRepo.itens.push(makeMembro('g1', 'membro-1'));
    membrosRepo.itens.push(makeMembro('g1', 'pend-1', 'pendente'));
    membrosRepo.usuarios.set('membro-1', {
      nome: 'Maria',
      email: 'm@c.br',
      perfil: 'Editor',
    });
    membrosRepo.usuarios.set('pend-1', {
      nome: 'João',
      email: 'j@c.br',
      perfil: 'Editor',
    });

    const sut = new GetGrupoDetalheUseCase(grupoRepo, membrosRepo, policy);

    const comoDono = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_ID: 'dono-1',
      DSC_PERFIL: 'Editor',
    });
    expect(comoDono.isRight()).toBe(true);
    if (comoDono.isRight()) {
      expect(comoDono.value.membros).toHaveLength(1);
      expect(comoDono.value.pendentes).toHaveLength(1);
      expect(comoDono.value.podeGerenciar).toBe(true);
    }

    const comoMembro = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_ID: 'membro-1',
      DSC_PERFIL: 'Editor',
    });
    if (comoMembro.isRight()) {
      expect(comoMembro.value.pendentes).toHaveLength(0);
      expect(comoMembro.value.podeGerenciar).toBe(false);
    }
  });

  it('detalhe: grupo "membros" bloqueado para nao-membro', async () => {
    grupoRepo.itens.push(makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' }));
    const sut = new GetGrupoDetalheUseCase(grupoRepo, membrosRepo, policy);
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_ID: 'intruso',
      DSC_PERFIL: 'Editor',
    });
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it('config: dono altera visibilidade/politica/contribuicao e transfere dono', async () => {
    grupoRepo.itens.push(makeGrupo('g1'));
    const sut = new UpdateGrupoConfigUseCase(grupoRepo, membrosRepo, policy);
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_SOLICITANTE: 'dono-1',
      DSC_PERFIL_SOLICITANTE: 'Editor',
      DSC_VISIBILIDADE: 'membros',
      DSC_POLITICA_PARTICIPACAO: 'aberto',
      BOL_MEMBROS_CONTRIBUEM: true,
      COD_USUARIO_DONO: 'novo-dono',
    });
    expect(result.isRight()).toBe(true);
    const salvo = await grupoRepo.findById('g1');
    expect(salvo?.grupoVisibilidade).toBe('membros');
    expect(salvo?.grupoPoliticaParticipacao).toBe('aberto');
    expect(salvo?.grupoMembrosContribuem).toBe(true);
    expect(salvo?.grupoDono).toBe('novo-dono');
    expect(
      membrosRepo.itens.some(
        (m) => m.userId === 'dono-1' && m.status === 'membro' && m.ativo,
      ),
    ).toBe(true);
  });

  it('transferencia: novo dono deixa de ter linha de membro', async () => {
    grupoRepo.itens.push(makeGrupo('g1'));
    membrosRepo.itens.push(makeMembro('g1', 'novo-dono'));
    const sut = new UpdateGrupoConfigUseCase(grupoRepo, membrosRepo, policy);
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_SOLICITANTE: 'dono-1',
      DSC_PERFIL_SOLICITANTE: 'Editor',
      COD_USUARIO_DONO: 'novo-dono',
    });
    expect(result.isRight()).toBe(true);

    const vinculoNovoDono = membrosRepo.itens.find(
      (m) => m.userId === 'novo-dono',
    );
    expect(vinculoNovoDono?.ativo).toBe(false);

    const vinculoDonoAnterior = membrosRepo.itens.find(
      (m) => m.userId === 'dono-1',
    );
    expect(vinculoDonoAnterior?.status).toBe('membro');
    expect(vinculoDonoAnterior?.ativo).toBe(true);
  });

  it('config: membro comum nao altera', async () => {
    grupoRepo.itens.push(makeGrupo('g1'));
    membrosRepo.itens.push(makeMembro('g1', 'membro-1'));
    const sut = new UpdateGrupoConfigUseCase(grupoRepo, membrosRepo, policy);
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_SOLICITANTE: 'membro-1',
      DSC_PERFIL_SOLICITANTE: 'Editor',
      DSC_VISIBILIDADE: 'publico',
    });
    expect(result.isLeft()).toBe(true);
  });

  it('atualiza nome e tema do grupo', async () => {
    const grupo = makeGrupo('g1', { USUARIO_DONO: 'user-1' });
    grupoRepo.itens.push(grupo);
    const sut = new UpdateGrupoConfigUseCase(grupoRepo, membrosRepo, policy);

    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
      NOM_NOME_GRUPO: 'Grupo Renomeado',
      COD_TEMA_ID: 'tema-2',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.grupo.grupoNome).toBe('Grupo Renomeado');
      expect(result.value.grupo.grupoTema).toBe('tema-2');
    }
  });

  it('overview: qtdItensVisiveis reflete o que o usuario ve, nao o total', async () => {
    const grupo = makeGrupo('g1', { DSC_VISIBILIDADE: 'membros' });
    grupoRepo.itens.push(grupo);
    grupoRepo.qtdItensPorGrupo.set('g1', 16);
    grupoRepo.qtdItensPublicoPorGrupo.set('g1', 3);
    grupoRepo.qtdItensInstitucionalPorGrupo.set('g1', 9);
    grupoRepo.qtdItensPrivadoTotalPorGrupo.set('g1', 4);
    grupoRepo.qtdItensPrivadoPorCriador.set('g1:user-1', 2);

    const sut = new FetchGruposOverviewUseCase(grupoRepo, membrosRepo, policy);

    const comoNaoMembro = await sut.execute({
      COD_USER_ID: 'user-1',
      DSC_PERFIL: 'Editor',
    });
    expect(comoNaoMembro.isRight()).toBe(true);
    if (comoNaoMembro.isRight()) {
      expect(comoNaoMembro.value.grupos).toHaveLength(0);
    }

    membrosRepo.itens.push(makeMembro('g1', 'user-1'));
    const comoMembro = await sut.execute({
      COD_USER_ID: 'user-1',
      DSC_PERFIL: 'Editor',
    });
    if (comoMembro.isRight()) {
      const item = comoMembro.value.grupos[0];
      expect(item.qtdItens).toBe(16);
      expect(item.qtdItensVisiveis).toBe(3 + 9 + 2);
    }

    const comoAdmin = await sut.execute({
      COD_USER_ID: 'admin-1',
      DSC_PERFIL: 'Admin',
    });
    if (comoAdmin.isRight()) {
      const item = comoAdmin.value.grupos[0];
      expect(item.qtdItensVisiveis).toBe(3 + 9 + 4);
    }
  });

  it('detalhe: qtdItensVisiveis calculado igual ao overview', async () => {
    const grupo = makeGrupo('g1');
    grupoRepo.itens.push(grupo);
    grupoRepo.qtdItensPorGrupo.set('g1', 10);
    grupoRepo.qtdItensPublicoPorGrupo.set('g1', 5);
    grupoRepo.qtdItensInstitucionalPorGrupo.set('g1', 5);

    const sut = new GetGrupoDetalheUseCase(grupoRepo, membrosRepo, policy);
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USER_ID: 'user-1',
      DSC_PERFIL: 'Editor',
    });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.qtdItensVisiveis).toBe(10);
    }
  });
});
