import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCamadaRasterUseCase } from './update-camada-raster';
import { InMemoryCamadasRasterRepository } from '../../../../../test/repositories/in-memory-camadas-raster-repository';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { GrupoMembro } from '@/domain/manager/enterprise/entities/grupo-membro';
import { CamadasRaster } from '../../enterprise/entities/camadas-raster';
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

describe('UpdateCamadaRasterUseCase', () => {
  let camadasRasterRepo: InMemoryCamadasRasterRepository;
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;
  let sut: UpdateCamadaRasterUseCase;

  beforeEach(() => {
    camadasRasterRepo = new InMemoryCamadasRasterRepository();
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);
    sut = new UpdateCamadaRasterUseCase(camadasRasterRepo, policy);
  });

  it('Publicador nao pode mover a camada raster para um grupo do qual nao e membro', async () => {
    const camadaRaster = CamadasRaster.create(
      {
        NOM_NOME: 'c1',
        DSC_TITULO: 't',
        DSC_DESCRICAO: 'd',
        DSC_LINK_METADADOS: '',
        TXT_TERMOS_DE_USO: '',
        NIVEL_COMPATILHAMENTO: 'niv-1',
        GRUPOS_CAMADAS: 'g-origem',
        TXT_TAGS: '',
        DSC_FONTE_DADOS_CAMADA: '',
        DHS_INCLUSAO: new Date(),
        USUARIO_CRIACAO: 'user-1',
        FLG_CAMADA_ATIVA: true,
      },
      new UniqueEntityID('c1'),
    );
    camadasRasterRepo.items.push(camadaRaster);
    grupoRepo.itens.push(
      makeGrupo('g-origem', { USUARIO_DONO: 'user-1' }),
      makeGrupo('g-destino'),
    );

    await expect(
      sut.execute({
        COD_CAMADA_RASTER_ID: 'c1',
        NOM_NOME: 'c1',
        DSC_TITULO: 't',
        DSC_DESCRICAO: 'd',
        DSC_LINK_METADADOS: '',
        TXT_TERMOS_DE_USO: '',
        NIVEL_COMPATILHAMENTO: 'niv-1',
        GRUPOS_CAMADAS: 'g-destino',
        TXT_TAGS: '',
        COD_USER_SOLICITANTE: 'user-1',
        DSC_PERFIL_SOLICITANTE: 'Publicador',
      }),
    ).rejects.toThrow(NotAllowedError);
  });

  it('Publicador membro do grupo destino pode mover a camada raster', async () => {
    const camadaRaster = CamadasRaster.create(
      {
        NOM_NOME: 'c1',
        DSC_TITULO: 't',
        DSC_DESCRICAO: 'd',
        DSC_LINK_METADADOS: '',
        TXT_TERMOS_DE_USO: '',
        NIVEL_COMPATILHAMENTO: 'niv-1',
        GRUPOS_CAMADAS: 'g-origem',
        TXT_TAGS: '',
        DSC_FONTE_DADOS_CAMADA: '',
        DHS_INCLUSAO: new Date(),
        USUARIO_CRIACAO: 'user-1',
        FLG_CAMADA_ATIVA: true,
      },
      new UniqueEntityID('c1'),
    );
    camadasRasterRepo.items.push(camadaRaster);
    grupoRepo.itens.push(
      makeGrupo('g-origem', { USUARIO_DONO: 'user-1' }),
      makeGrupo('g-destino'),
    );
    membrosRepo.itens.push(makeMembro('g-destino', 'user-1'));

    await sut.execute({
      COD_CAMADA_RASTER_ID: 'c1',
      NOM_NOME: 'c1',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      GRUPOS_CAMADAS: 'g-destino',
      TXT_TAGS: '',
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
    });

    const atualizado = await camadasRasterRepo.findById('c1');
    expect(atualizado?.camadaGruposCamadas).toBe('g-destino');
  });
});
