import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateGrupoUseCase } from './update-grupo';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { GrupoSiglaAlreadyExistsError } from './errors/grupo-sigla-already-exists-error';

function makeGrupo(id: string, sigla: string) {
  return Grupo.create(
    {
      NOM_NOME_GRUPO: `Grupo ${id}`,
      SGL_GRUPO_ID: sigla,
      USUARIO_CRIACAO: 'user-1',
      COD_TEMA_ID: 'tema-1',
      DHS_INCLUSAO: new Date(),
      USUARIO_ALTERACAO: null,
      USUARIO_DONO: 'user-1',
    },
    new UniqueEntityID(id),
  );
}

describe('UpdateGrupoUseCase', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let sut: UpdateGrupoUseCase;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    sut = new UpdateGrupoUseCase(grupoRepo);
    grupoRepo.itens.push(makeGrupo('g1', 'RA'));
    grupoRepo.itens.push(makeGrupo('g2', 'SB'));
  });

  it('atualiza a sigla do grupo com sucesso', async () => {
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      NOM_NOME_GRUPO: 'Rede de Água',
      COD_TEMA_ID: 'tema-1',
      USUARIO_ULTIMA_ALTERACAO: 'user-1',
      SGL_GRUPO_ID: 'RE',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.grupo.grupoSigla).toBe('RE');
    }
  });

  it('permite salvar mantendo a mesma sigla do proprio grupo', async () => {
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      NOM_NOME_GRUPO: 'Rede de Água',
      COD_TEMA_ID: 'tema-1',
      USUARIO_ULTIMA_ALTERACAO: 'user-1',
      SGL_GRUPO_ID: 'RA',
    });

    expect(result.isRight()).toBe(true);
  });

  it('rejeita sigla ja usada por outro grupo', async () => {
    const result = await sut.execute({
      COD_GRUPO_ID: 'g1',
      NOM_NOME_GRUPO: 'Rede de Água',
      COD_TEMA_ID: 'tema-1',
      USUARIO_ULTIMA_ALTERACAO: 'user-1',
      SGL_GRUPO_ID: 'SB',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(GrupoSiglaAlreadyExistsError);
  });
});
