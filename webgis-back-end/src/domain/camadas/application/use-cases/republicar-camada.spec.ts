import { describe, it, expect, beforeEach } from 'vitest';
import { RepublicarCamadaUseCase } from './republicar-camada';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { InMemoryCamadasRepository } from '../../../../../test/repositories/in-memory-camadas-repository';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { Camadas } from '../../enterprise/entities/camadas';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
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

function makeCamada(id: string) {
  return Camadas.create(
    {
      NOM_NOME: 'dmc_limites',
      DSC_TITULO: 'DMC',
      DSC_DESCRICAO: 'descrição',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'nivel-1',
      GRUPOS_CAMADAS: 'g1',
      TXT_TAGS: '',
      PACOTES_CONCEITUAIS: 'pacote-1',
      DSC_FONTE_DADOS_CAMADA: '',
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: 'criador-item',
      FLG_CAMADA_ATIVA: true,
    },
    new UniqueEntityID(id),
  );
}

const metadados = {
  DSC_TITULO: 'DMC atualizado',
  DSC_DESCRICAO: 'nova descrição',
  DSC_LINK_METADADOS: '',
  TXT_TERMOS_DE_USO: '',
  NIVEL_COMPATILHAMENTO: 'nivel-1',
  GRUPOS_CAMADAS: 'g1',
  TXT_TAGS: 'tag',
  DSC_FONTE_DADOS_CAMADA: 'fonte',
  BOL_CARREGAMENTO_DEFAULT: false,
};

describe('RepublicarCamadaUseCase', () => {
  let camadasRepo: InMemoryCamadasRepository;
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;

  beforeEach(() => {
    camadasRepo = new InMemoryCamadasRepository();
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);

    grupoRepo.itens.push(makeGrupo('g1'));
    grupoRepo.itens.push(makeGrupo('g2', { USUARIO_DONO: 'dono-2' }));
    camadasRepo.itens.push(makeCamada('camada-1'));
  });

  function sut() {
    return new RepublicarCamadaUseCase(camadasRepo, policy);
  }

  it('criador da camada republica com sucesso, salva metadados e marca publishing', async () => {
    const result = await sut().execute({
      COD_CAMADA_ID: 'camada-1',
      metadados,
      requesterId: 'criador-item',
      perfilRequester: 'Publicador',
    });

    expect(result.isRight()).toBe(true);

    const camada = camadasRepo.itens.find(
      (c) => c.id.toString() === 'camada-1',
    )!;
    expect(camada.camadaTitulo).toBe('DMC atualizado');
    expect(camada.camadaStatus).toBe('publishing');
    expect(camada.camadaErrorMsg).toBeNull();
  });

  it('Admin republica camada de outra pessoa', async () => {
    const result = await sut().execute({
      COD_CAMADA_ID: 'camada-1',
      metadados,
      requesterId: 'admin-1',
      perfilRequester: 'Admin',
    });

    expect(result.isRight()).toBe(true);
  });

  it('nao-membro do grupo da camada e bloqueado', async () => {
    const result = await sut().execute({
      COD_CAMADA_ID: 'camada-1',
      metadados,
      requesterId: 'estranho',
      perfilRequester: 'Publicador',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it('camada inexistente retorna ResourceNotFoundError', async () => {
    const result = await sut().execute({
      COD_CAMADA_ID: 'nao-existe',
      metadados,
      requesterId: 'criador-item',
      perfilRequester: 'Publicador',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('mover a camada para grupo do qual nao e membro e bloqueado', async () => {
    const result = await sut().execute({
      COD_CAMADA_ID: 'camada-1',
      metadados: { ...metadados, GRUPOS_CAMADAS: 'g2' },
      requesterId: 'criador-item',
      perfilRequester: 'Publicador',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });
});
