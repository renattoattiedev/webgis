import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCamadaUseCase } from './create-camada';
import { InMemoryCamadasRepository } from '../../../../../test/repositories/in-memory-camadas-repository';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';

describe('CreateCamadaUseCase', () => {
  let camadasRepo: InMemoryCamadasRepository;
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;
  let sut: CreateCamadaUseCase;

  beforeEach(() => {
    camadasRepo = new InMemoryCamadasRepository();
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);
    sut = new CreateCamadaUseCase(camadasRepo, policy);

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

  it('Publicador nao-membro nao pode publicar no grupo', async () => {
    const result = await sut.execute({
      NOM_NOME: 'camada-1',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      GRUPOS_CAMADAS: 'g1',
      TXT_TAGS: '',
      PACOTES_CONCEITUAIS: '',
      DSC_FONTE_DADOS_CAMADA: '',
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: 'user-1',
      COD_USER_SOLICITANTE: 'user-1',
      DSC_PERFIL_SOLICITANTE: 'Publicador',
    });
    expect(result.isLeft()).toBe(true);
  });

  it('Admin sempre pode publicar, mesmo sem ser membro', async () => {
    const result = await sut.execute({
      NOM_NOME: 'camada-2',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      GRUPOS_CAMADAS: 'g1',
      TXT_TAGS: '',
      PACOTES_CONCEITUAIS: '',
      DSC_FONTE_DADOS_CAMADA: '',
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: 'admin-1',
      COD_USER_SOLICITANTE: 'admin-1',
      DSC_PERFIL_SOLICITANTE: 'Admin',
    });
    expect(result.isRight()).toBe(true);
  });

  it('sem COD_USER_SOLICITANTE, cria sem checagem (chamada interna)', async () => {
    const result = await sut.execute({
      NOM_NOME: 'camada-3',
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'niv-1',
      GRUPOS_CAMADAS: 'g1',
      TXT_TAGS: '',
      PACOTES_CONCEITUAIS: '',
      DSC_FONTE_DADOS_CAMADA: '',
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: 'user-1',
    });
    expect(result.isRight()).toBe(true);
  });
});
