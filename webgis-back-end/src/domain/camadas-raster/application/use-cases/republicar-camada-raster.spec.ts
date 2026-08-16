import { describe, it, expect, beforeEach } from 'vitest';
import { RepublicarCamadaRasterUseCase } from './republicar-camada-raster';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { InMemoryCamadasRasterRepository } from '../../../../../test/repositories/in-memory-camadas-raster-repository';
import { InMemoryGrupoRepository } from '../../../../../test/repositories/in-memory-grupo-repository';
import { InMemoryGrupoMembrosRepository } from '../../../../../test/repositories/in-memory-grupo-membros-repository';
import { CamadasRaster } from '../../enterprise/entities/camadas-raster';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';

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

function makeRaster(id: string) {
  return CamadasRaster.create(
    {
      NOM_NOME: 'orto__2026',
      DSC_FONTE_DADOS_CAMADA: 'orto/2026.tif',
      DSC_TITULO: 'Ortofoto',
      DSC_DESCRICAO: 'descrição',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'nivel-1',
      GRUPOS_CAMADAS: 'g1',
      TXT_TAGS: '',
      DHS_INCLUSAO: new Date(),
      USUARIO_CRIACAO: 'criador-item',
      FLG_CAMADA_ATIVA: true,
    },
    new UniqueEntityID(id),
  );
}

const metadados = {
  DSC_TITULO: 'Ortofoto 2026',
  DSC_DESCRICAO: 'nova descrição',
  DSC_LINK_METADADOS: '',
  TXT_TERMOS_DE_USO: '',
  NIVEL_COMPATILHAMENTO: 'nivel-1',
  GRUPOS_CAMADAS: 'g1',
  TXT_TAGS: '',
  BOL_CARREGAMENTO_DEFAULT: false,
};

describe('RepublicarCamadaRasterUseCase', () => {
  let rasterRepo: InMemoryCamadasRasterRepository;
  let grupoRepo: InMemoryGrupoRepository;
  let membrosRepo: InMemoryGrupoMembrosRepository;
  let policy: GrupoAccessPolicy;

  beforeEach(() => {
    rasterRepo = new InMemoryCamadasRasterRepository();
    grupoRepo = new InMemoryGrupoRepository();
    membrosRepo = new InMemoryGrupoMembrosRepository();
    policy = new GrupoAccessPolicy(grupoRepo, membrosRepo);

    grupoRepo.itens.push(makeGrupo('g1'));
    rasterRepo.items.push(makeRaster('raster-1'));
  });

  function sut() {
    return new RepublicarCamadaRasterUseCase(rasterRepo, policy);
  }

  it('criador republica e recebe o caminho do arquivo', async () => {
    const result = await sut().execute({
      COD_CAMADA_RASTER_ID: 'raster-1',
      metadados,
      requesterId: 'criador-item',
      perfilRequester: 'Publicador',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.relativePath).toBe('orto/2026.tif');
      expect(result.value.nomeFlat).toBe('orto__2026');
    }
  });

  it('nao-membro e bloqueado', async () => {
    const result = await sut().execute({
      COD_CAMADA_RASTER_ID: 'raster-1',
      metadados,
      requesterId: 'estranho',
      perfilRequester: 'Publicador',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(NotAllowedError);
  });

  it('raster inexistente retorna ResourceNotFoundError', async () => {
    const result = await sut().execute({
      COD_CAMADA_RASTER_ID: 'nao-existe',
      metadados,
      requesterId: 'criador-item',
      perfilRequester: 'Publicador',
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ResourceNotFoundError);
  });

  it('o registro do raster nao e excluido pela republicacao', async () => {
    await sut().execute({
      COD_CAMADA_RASTER_ID: 'raster-1',
      metadados,
      requesterId: 'criador-item',
      perfilRequester: 'Publicador',
    });

    const raster = await rasterRepo.findById('raster-1');
    expect(raster).not.toBeNull();
    expect(raster!.camadaTitulo).toBe('Ortofoto 2026');
  });
});
