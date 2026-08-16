import { describe, it, expect, beforeEach } from 'vitest';
import { CreateMapaUseCase } from './create-mapa';
import { InMemoryMapasRepository } from '../../../../../test/repositories/in-memory-mapas-repository';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';

describe('CreateMapaUseCase', () => {
  let mapasRepo: InMemoryMapasRepository;
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;
  let sut: CreateMapaUseCase;

  beforeEach(() => {
    mapasRepo = new InMemoryMapasRepository();
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);
    sut = new CreateMapaUseCase(mapasRepo, policy);

    grupoRepo.itens.push(
      Grupo.create(
        {
          NOM_NOME_GRUPO: 'Grupo 1',
          SGL_GRUPO_ID: 'G1',
          USUARIO_CRIACAO: 'dono-1',
          COD_TEMA_ID: 'tema-1',
          DHS_INCLUSAO: new Date(),
          USUARIO_ALTERACAO: null,
        },
        new UniqueEntityID('g1'),
      ),
    );
  });

  it('Publicador nao-membro nao pode salvar mapa no grupo', async () => {
    const result = await sut.execute({
      COD_MAPA_ID: new UniqueEntityID(),
      GRUPOS_MAPAS: 'g1',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      NOM_NOME_MAPA: 'mapa-1',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_BOUNDING_BOX: null,
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
    });
    expect(result.isLeft()).toBe(true);
  });

  it('Admin sempre pode salvar mapa, mesmo sem ser membro', async () => {
    const result = await sut.execute({
      COD_MAPA_ID: new UniqueEntityID(),
      GRUPOS_MAPAS: 'g1',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      NOM_NOME_MAPA: 'mapa-2',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_BOUNDING_BOX: null,
      USUARIO_CRIACAO: 'admin-1',
      DHS_INCLUSAO: new Date(),
      COD_USER_SOLICITANTE: 'admin-1',
      DSC_PERFIL_SOLICITANTE: 'Admin',
    });
    expect(result.isRight()).toBe(true);
  });

  it('Fail-open: sem COD_USER_SOLICITANTE, permite salvar (uso interno)', async () => {
    const result = await sut.execute({
      COD_MAPA_ID: new UniqueEntityID(),
      GRUPOS_MAPAS: 'g1',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      NOM_NOME_MAPA: 'mapa-3',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_BOUNDING_BOX: null,
      USUARIO_CRIACAO: 'user-1',
      DHS_INCLUSAO: new Date(),
    });
    expect(result.isRight()).toBe(true);
  });
});
