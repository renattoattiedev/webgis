import { describe, it, expect, beforeEach } from 'vitest';
import { ListRasterFilesUseCase } from './list-raster-files';
import { InMemoryRasterFilesRepository } from '../../../../infra/filesystem/in-memory-raster-files-repository';
import { InMemoryCamadasRasterRepository } from '../../../../../test/repositories/in-memory-camadas-raster-repository';
import { RasterFile } from '../../enterprise/entities/raster-file';
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

describe('ListRasterFilesUseCase', () => {
  let filesRepo: InMemoryRasterFilesRepository;
  let camadasRepo: InMemoryCamadasRasterRepository;
  let sut: ListRasterFilesUseCase;

  beforeEach(() => {
    filesRepo = new InMemoryRasterFilesRepository();
    camadasRepo = new InMemoryCamadasRasterRepository();
    sut = new ListRasterFilesUseCase(filesRepo, camadasRepo);
  });

  it('retorna filhos com flag alreadyPublished resolvida', async () => {
    filesRepo.items.set('upload_raster', [
      RasterFile.file('a.tif', 'upload_raster/a.tif', 1024, '.tif'),
      RasterFile.file('b.tif', 'upload_raster/b.tif', 2048, '.tif'),
    ]);
    await camadasRepo.create(makeCamada('upload_raster/a.tif', 'camada-id-1'));

    const result = await sut.execute({ relativePath: 'upload_raster' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      const items = result.value.items;
      expect(items[0].alreadyPublished).toBe(true);
      expect(items[0].camadaId).toBe('camada-id-1');
      expect(items[1].alreadyPublished).toBe(false);
      expect(items[1].camadaId).toBeUndefined();
    }
  });

  it('diretórios não recebem flag alreadyPublished', async () => {
    filesRepo.items.set('', [RasterFile.directory('sub', 'sub')]);
    const result = await sut.execute({ relativePath: '' });
    if (result.isRight()) {
      expect(result.value.items[0].alreadyPublished).toBeUndefined();
    }
  });
});
