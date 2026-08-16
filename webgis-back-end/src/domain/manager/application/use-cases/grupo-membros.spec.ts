import { describe, it, expect, beforeEach } from 'vitest';
import { AddGrupoMembroUseCase } from './add-grupo-membro';
import { RemoveGrupoMembroUseCase } from './remove-grupo-membro';
import { SairGrupoUseCase } from './sair-grupo';
import { SolicitarParticipacaoGrupoUseCase } from './solicitar-participacao-grupo';
import { ResponderSolicitacaoGrupoUseCase } from './responder-solicitacao-grupo';
import { ParticiparGrupoUseCase } from './participar-grupo';
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

describe('use-cases de membership de grupo', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);
    grupoRepo.itens.push(makeGrupo('g1'));
  });

  describe('AddGrupoMembroUseCase', () => {
    it('dono adiciona membro diretamente', async () => {
      const sut = new AddGrupoMembroUseCase(grupoRepo, membrosRepo, policy);
      const result = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID_ALVO: 'novo-1',
        COD_USER_SOLICITANTE: 'dono-1',
        DSC_PERFIL_SOLICITANTE: 'Editor',
      });
      expect(result.isRight()).toBe(true);
      expect(await membrosRepo.countMembrosByGrupo('g1')).toBe(1);
    });

    it('nao-gerenciador nao pode adicionar', async () => {
      const sut = new AddGrupoMembroUseCase(grupoRepo, membrosRepo, policy);
      const result = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID_ALVO: 'novo-1',
        COD_USER_SOLICITANTE: 'intruso',
        DSC_PERFIL_SOLICITANTE: 'Editor',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });

    it('reativa vinculo soft-deletado em vez de duplicar', async () => {
      const antigo = makeMembro('g1', 'novo-1');
      antigo.excluir('dono-1');
      membrosRepo.itens.push(antigo);

      const sut = new AddGrupoMembroUseCase(grupoRepo, membrosRepo, policy);
      const result = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID_ALVO: 'novo-1',
        COD_USER_SOLICITANTE: 'dono-1',
        DSC_PERFIL_SOLICITANTE: 'Editor',
      });
      expect(result.isRight()).toBe(true);
      expect(membrosRepo.itens).toHaveLength(1);
      expect(membrosRepo.itens[0].ativo).toBe(true);
    });
  });

  describe('RemoveGrupoMembroUseCase / SairGrupoUseCase', () => {
    it('dono remove membro (soft delete)', async () => {
      membrosRepo.itens.push(makeMembro('g1', 'membro-1'));
      const sut = new RemoveGrupoMembroUseCase(grupoRepo, membrosRepo, policy);
      const result = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID_ALVO: 'membro-1',
        COD_USER_SOLICITANTE: 'dono-1',
        DSC_PERFIL_SOLICITANTE: 'Editor',
        DSC_PERFIL_ALVO: 'Editor',
      });
      expect(result.isRight()).toBe(true);
      expect(membrosRepo.itens[0].ativo).toBe(false);
    });

    it('nao pode remover um membro Admin', async () => {
      membrosRepo.itens.push(makeMembro('g1', 'admin-2'));
      const sut = new RemoveGrupoMembroUseCase(grupoRepo, membrosRepo, policy);
      const result = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID_ALVO: 'admin-2',
        COD_USER_SOLICITANTE: 'dono-1',
        DSC_PERFIL_SOLICITANTE: 'Editor',
        DSC_PERFIL_ALVO: 'Admin',
      });
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(NotAllowedError);
    });

    it('membro sai do grupo; dono nao pode sair', async () => {
      membrosRepo.itens.push(makeMembro('g1', 'membro-1'));
      const sut = new SairGrupoUseCase(grupoRepo, membrosRepo);

      const ok = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID: 'membro-1',
      });
      expect(ok.isRight()).toBe(true);
      expect(membrosRepo.itens[0].ativo).toBe(false);

      const donoSair = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID: 'dono-1',
      });
      expect(donoSair.isLeft()).toBe(true);
    });
  });

  describe('fluxo solicitar/responder', () => {
    it('usuario solicita quando politica = solicitacao; dono aprova', async () => {
      grupoRepo.itens = [
        makeGrupo('g2', { DSC_POLITICA_PARTICIPACAO: 'solicitacao' }),
      ];
      const solicitar = new SolicitarParticipacaoGrupoUseCase(
        grupoRepo,
        membrosRepo,
      );
      const responder = new ResponderSolicitacaoGrupoUseCase(
        grupoRepo,
        membrosRepo,
        policy,
      );

      const pedido = await solicitar.execute({
        COD_GRUPO_ID: 'g2',
        COD_USER_ID: 'user-1',
      });
      expect(pedido.isRight()).toBe(true);
      expect(membrosRepo.itens[0].status).toBe('pendente');

      const aprovacao = await responder.execute({
        COD_GRUPO_ID: 'g2',
        COD_USER_ID_ALVO: 'user-1',
        APROVAR: true,
        COD_USER_SOLICITANTE: 'dono-1',
        DSC_PERFIL_SOLICITANTE: 'Editor',
      });
      expect(aprovacao.isRight()).toBe(true);
      expect(membrosRepo.itens[0].status).toBe('membro');
    });

    it('recusa faz soft delete do pedido', async () => {
      grupoRepo.itens = [
        makeGrupo('g2', { DSC_POLITICA_PARTICIPACAO: 'solicitacao' }),
      ];
      membrosRepo.itens.push(makeMembro('g2', 'user-1', 'pendente'));
      const responder = new ResponderSolicitacaoGrupoUseCase(
        grupoRepo,
        membrosRepo,
        policy,
      );
      const result = await responder.execute({
        COD_GRUPO_ID: 'g2',
        COD_USER_ID_ALVO: 'user-1',
        APROVAR: false,
        COD_USER_SOLICITANTE: 'dono-1',
        DSC_PERFIL_SOLICITANTE: 'Editor',
      });
      expect(result.isRight()).toBe(true);
      expect(membrosRepo.itens[0].ativo).toBe(false);
    });

    it('solicitar em grupo com politica convite falha', async () => {
      const solicitar = new SolicitarParticipacaoGrupoUseCase(
        grupoRepo,
        membrosRepo,
      );
      const result = await solicitar.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID: 'user-1',
      });
      expect(result.isLeft()).toBe(true);
    });
  });

  describe('ParticiparGrupoUseCase', () => {
    it('entra na hora quando politica = aberto', async () => {
      grupoRepo.itens = [
        makeGrupo('g3', { DSC_POLITICA_PARTICIPACAO: 'aberto' }),
      ];
      const sut = new ParticiparGrupoUseCase(grupoRepo, membrosRepo);
      const result = await sut.execute({
        COD_GRUPO_ID: 'g3',
        COD_USER_ID: 'user-1',
      });
      expect(result.isRight()).toBe(true);
      expect(await membrosRepo.countMembrosByGrupo('g3')).toBe(1);
    });

    it('falha quando politica nao e aberto', async () => {
      const sut = new ParticiparGrupoUseCase(grupoRepo, membrosRepo);
      const result = await sut.execute({
        COD_GRUPO_ID: 'g1',
        COD_USER_ID: 'user-1',
      });
      expect(result.isLeft()).toBe(true);
    });
  });
});
