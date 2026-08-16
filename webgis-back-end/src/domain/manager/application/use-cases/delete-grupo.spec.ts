import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteGrupoUseCase } from './delete-grupo';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

function makeGrupo(id: string) {
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
    },
    new UniqueEntityID(id),
  );
}

describe('DeleteGrupoUseCase', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let sut: DeleteGrupoUseCase;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    sut = new DeleteGrupoUseCase(grupoRepo);
  });

  it('grupo inexistente retorna erro', async () => {
    const result = await sut.execute({
      COD_GRUPO_ID: 'inexistente',
      COD_USUARIO_EXCLUSAO: 'admin-1',
    });
    expect(result.isLeft()).toBe(true);
  });

  it('bloqueia exclusao quando ha conteudo ativo associado', async () => {
    grupoRepo.itens.push(makeGrupo('g1'));
    grupoRepo.qtdItensPorGrupo.set('g1', 1);
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USUARIO_EXCLUSAO: 'admin-1',
    });
    expect(result.isLeft()).toBe(true);
    expect(grupoRepo.excluidos.has('g1')).toBe(false);
  });

  it('permite exclusao quando o grupo nao tem conteudo ativo', async () => {
    grupoRepo.itens.push(makeGrupo('g1'));
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      COD_USUARIO_EXCLUSAO: 'admin-1',
    });
    expect(result.isRight()).toBe(true);
    expect(grupoRepo.excluidos.has('g1')).toBe(true);
  });
});
