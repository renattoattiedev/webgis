import { describe, it, expect, beforeEach } from 'vitest';
import { CreateGrupoUseCase } from './create-grupo';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { GrupoCamadaAlreadyExistsError } from './errors/grupo-camada-already-exists-error';
import { GrupoSiglaAlreadyExistsError } from './errors/grupo-sigla-already-exists-error';

describe('CreateGrupoUseCase', () => {
  let grupoRepo: InMemoryGrupoRepository;
  let sut: CreateGrupoUseCase;

  beforeEach(() => {
    grupoRepo = new InMemoryGrupoRepository();
    sut = new CreateGrupoUseCase(grupoRepo);
  });

  it('gera a sigla automaticamente quando nenhuma e informada', async () => {
    const result = await sut.execute({
      COD_GRUPO_CAMADA_ID: new UniqueEntityID(),
      NOM_NOME_GRUPO: 'Rede de Água',
      COD_TEMA_ID: 'tema-1',
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.grupo.grupoSigla).toBe('RA');
    }
  });

  it('usa a sigla informada quando presente', async () => {
    const result = await sut.execute({
      COD_GRUPO_CAMADA_ID: new UniqueEntityID(),
      NOM_NOME_GRUPO: 'Rede de Água',
      COD_TEMA_ID: 'tema-1',
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
      SGL_GRUPO_ID: 'RG',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.grupo.grupoSigla).toBe('RG');
    }
  });

  it('rejeita sigla informada ja em uso por outro grupo', async () => {
    await sut.execute({
      COD_GRUPO_CAMADA_ID: new UniqueEntityID('g1'),
      NOM_NOME_GRUPO: 'Grupo 1',
      COD_TEMA_ID: 'tema-1',
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
      SGL_GRUPO_ID: 'RA',
    });

    const result = await sut.execute({
      COD_GRUPO_CAMADA_ID: new UniqueEntityID('g2'),
      NOM_NOME_GRUPO: 'Grupo 2',
      COD_TEMA_ID: 'tema-1',
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
      SGL_GRUPO_ID: 'RA',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(GrupoSiglaAlreadyExistsError);
  });

  it('rejeita nome de grupo duplicado (comportamento existente preservado)', async () => {
    await sut.execute({
      COD_GRUPO_CAMADA_ID: new UniqueEntityID('g1'),
      NOM_NOME_GRUPO: 'Grupo Repetido',
      COD_TEMA_ID: 'tema-1',
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
    });

    const result = await sut.execute({
      COD_GRUPO_CAMADA_ID: new UniqueEntityID('g2'),
      NOM_NOME_GRUPO: 'Grupo Repetido',
      COD_TEMA_ID: 'tema-1',
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(GrupoCamadaAlreadyExistsError);
  });
});
