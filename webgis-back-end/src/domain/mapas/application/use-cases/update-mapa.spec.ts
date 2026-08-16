import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateMapaUseCase } from './update-mapa';
import { InMemoryMapasRepository } from '../../../../../test/repositories/in-memory-mapas-repository';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { GrupoMembro } from '@/domain/manager/enterprise/entities/grupo-membro';
import { Mapas } from '../../enterprise/entities/mapas';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

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

describe('UpdateMapaUseCase', () => {
  let mapasRepo: InMemoryMapasRepository;
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;
  let sut: UpdateMapaUseCase;

  beforeEach(() => {
    mapasRepo = new InMemoryMapasRepository();
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);
    sut = new UpdateMapaUseCase(mapasRepo, policy);
  });

  it('Publicador nao pode mover o mapa para um grupo do qual nao e membro', async () => {
    const mapa = Mapas.create(
      {
        GRUPOS_MAPAS: 'g-origem',
        NIVEL_COMPATILHAMENTO: 'niv-1',
        NOM_NOME_MAPA: 'm1',
        DSC_TITULO: 't',
        DSC_DESCRICAO: 'd',
        DHS_INCLUSAO: new Date(),
        USUARIO_CRIACAO: 'user-1',
      },
      new UniqueEntityID('m1'),
    );
    mapasRepo.itens.push(mapa);
    grupoRepo.itens.push(
      makeGrupo('g-origem', { USUARIO_DONO: 'user-1' }),
      makeGrupo('g-destino'),
    );

    const result = await sut.execute({
      COD_MAPA_ID: 'm1',
      GRUPOS_MAPAS: 'g-destino',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      NOM_NOME_MAPA: 'm1',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_BOUNDING_BOX: '',
      COD_USUARIO_ULTIMA_ALTERACAO: '',
      BOL_CARREGAMENTO_DEFAULT: false,
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it('Publicador membro do grupo destino pode mover o mapa', async () => {
    const mapa = Mapas.create(
      {
        GRUPOS_MAPAS: 'g-origem',
        NIVEL_COMPATILHAMENTO: 'niv-1',
        NOM_NOME_MAPA: 'm1',
        DSC_TITULO: 't',
        DSC_DESCRICAO: 'd',
        DHS_INCLUSAO: new Date(),
        USUARIO_CRIACAO: 'user-1',
      },
      new UniqueEntityID('m1'),
    );
    mapasRepo.itens.push(mapa);
    grupoRepo.itens.push(
      makeGrupo('g-origem', { USUARIO_DONO: 'user-1' }),
      makeGrupo('g-destino'),
    );
    membrosRepo.itens.push(makeMembro('g-destino', 'user-1'));

    const result = await sut.execute({
      COD_MAPA_ID: 'm1',
      GRUPOS_MAPAS: 'g-destino',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      NOM_NOME_MAPA: 'm1',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_BOUNDING_BOX: '',
      COD_USUARIO_ULTIMA_ALTERACAO: '',
      BOL_CARREGAMENTO_DEFAULT: false,
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
    });

    expect(result.isRight()).toBe(true);
  });
});
