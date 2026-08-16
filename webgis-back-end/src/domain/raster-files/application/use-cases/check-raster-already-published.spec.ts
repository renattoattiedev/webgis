import { describe, it, expect, beforeEach } from 'vitest';
import { CheckRasterAlreadyPublishedUseCase } from './check-raster-already-published';
import { InMemoryCamadasRasterRepository } from '../../../../../test/repositories/in-memory-camadas-raster-repository';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

function makeCamada(fonte: string, id: string) {
  return CamadasRaster.create(
    {
      NOM_NOME: 'qualquer',
      DSC_FONTE_DADOS_CAMADA: fonte,
      DSC_TITULO: 't',
      DSC_DESCRICAO: 'd',
      DSC_LINK_METADADOS: '',
      TXT_TERMOS_DE_USO: '',
      NIVEL_COMPATILHAMENTO: 'lvl',
      GRUPOS_CAMADAS: 'grp',
      TXT_TAGS: '',
      DSC_BOUNDING_BOX: null,
      USUARIO_CRIACAO: 'u',
      DHS_INCLUSAO: new Date(),
      DHS_ULTIMA_ALTERACAO: null,
      DHS_EXCLUSAO: null,
      FLG_CAMADA_ATIVA: true,
      BOL_CARREGAMENTO_DEFAULT: false,
      DSC_STATUS: 'published',
      NUM_UPLOAD_PROGRESS: 100,
    },
    new UniqueEntityID(id),
  );
}

describe('CheckRasterAlreadyPublishedUseCase', () => {
  let repo: InMemoryCamadasRasterRepository;
  let sut: CheckRasterAlreadyPublishedUseCase;

  beforeEach(() => {
    repo = new InMemoryCamadasRasterRepository();
    sut = new CheckRasterAlreadyPublishedUseCase(repo);
  });

  it('retorna alreadyPublished=true e camadaId quando registro existe', async () => {
    await repo.create(makeCamada('upload_raster/a.tif', 'cam-1'));
    const result = await sut.execute({ relativePath: 'upload_raster/a.tif' });
    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value).toEqual({
        alreadyPublished: true,
        camadaId: 'cam-1',
      });
    }
  });

  it('retorna alreadyPublished=false quando registro não existe', async () => {
    const result = await sut.execute({
      relativePath: 'upload_raster/nope.tif',
    });
    if (result.isRight()) {
      expect(result.value.alreadyPublished).toBe(false);
      expect(result.value.camadaId).toBeUndefined();
    }
  });
});
