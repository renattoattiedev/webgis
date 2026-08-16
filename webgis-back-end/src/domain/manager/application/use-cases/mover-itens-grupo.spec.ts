import { describe, it, expect, beforeEach } from 'vitest';
import { MoverItensGrupoUseCase } from './mover-itens-grupo';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '../../enterprise/entities/grupo';
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
      USUARIO_CRIACAO: 'dono-1',
      COD_TEMA_ID: 'tema-1',
      DHS_INCLUSAO: new Date(),
      USUARIO_ALTERACAO: null,
      ...overrides,
    },
    new UniqueEntityID(id),
  );
}

describe('MoverItensGrupoUseCase', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;
  let sut: MoverItensGrupoUseCase;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);
    sut = new MoverItensGrupoUseCase(grupoRepo, policy);
  });

  it('move os itens quando o solicitante e membro do grupo destino', async () => {
    grupoRepo.itens.push(
      makeGrupo('g-origem', { USUARIO_DONO: 'user-1' }),
      makeGrupo('g-destino', { USUARIO_DONO: 'user-1' }),
    );
    grupoRepo.qtdItensPorGrupo.set('g-origem', 3);

    const result = await sut.execute({
      COD_GRUPO_ORIGEM_ID: 'g-origem',
      COD_GRUPO_DESTINO_ID: 'g-destino',
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.qtdItensMovidos).toBe(3);
    }
  });

  it('Publicador nao pode mover para um grupo do qual nao e membro', async () => {
    grupoRepo.itens.push(
      makeGrupo('g-origem', { USUARIO_DONO: 'user-1' }),
      makeGrupo('g-destino'),
    );
    grupoRepo.qtdItensPorGrupo.set('g-origem', 3);

    const result = await sut.execute({
      COD_GRUPO_ORIGEM_ID: 'g-origem',
      COD_GRUPO_DESTINO_ID: 'g-destino',
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(NotAllowedError);
    }
  });

  it('grupo origem inexistente retorna ResourceNotFoundError', async () => {
    grupoRepo.itens.push(makeGrupo('g-destino'));

    const result = await sut.execute({
      COD_GRUPO_ORIGEM_ID: 'nao-existe',
      COD_GRUPO_DESTINO_ID: 'g-destino',
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Admin',
    });

    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(ResourceNotFoundError);
    }
  });

  it('Admin pode mover para qualquer grupo', async () => {
    grupoRepo.itens.push(
      makeGrupo('g-origem', { USUARIO_DONO: 'user-1' }),
      makeGrupo('g-destino'),
    );
    grupoRepo.qtdItensPorGrupo.set('g-origem', 5);

    const result = await sut.execute({
      COD_GRUPO_ORIGEM_ID: 'g-origem',
      COD_GRUPO_DESTINO_ID: 'g-destino',
      COD_USER_SOLICITANTE: 'admin-1',
      DSC_PERFIL_SOLICITANTE: 'Admin',
    });

    expect(result.isRight()).toBe(true);
  });
});
