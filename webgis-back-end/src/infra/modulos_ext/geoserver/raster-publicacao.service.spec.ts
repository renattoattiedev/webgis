import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RasterPublicacaoService } from './raster-publicacao.service';

describe('RasterPublicacaoService', () => {
  let geoClient: any;
  let sut: RasterPublicacaoService;

  beforeEach(() => {
    geoClient = {
      criaDataStoreGeoTiff: vi.fn().mockResolvedValue(undefined),
      publicarCamadaGeoTiff: vi.fn().mockResolvedValue(undefined),
      configurarTileCacheRaster: vi.fn().mockResolvedValue(undefined),
    };
    sut = new RasterPublicacaoService(geoClient);
    sut.setGeoserverRasterPath('/opt/geoserver_data/raster');
  });

  it('achata path com subpastas em nome flat com __ e monta filePath absoluto', async () => {
    await sut.publicar('upload_raster/2024/ortofoto_norte.tif');

    expect(geoClient.criaDataStoreGeoTiff).toHaveBeenCalledWith(
      'upload_raster__2024__ortofoto_norte',
      'raster',
      '/opt/geoserver_data/raster/upload_raster/2024/ortofoto_norte.tif',
    );
    expect(geoClient.publicarCamadaGeoTiff).toHaveBeenCalledWith(
      'upload_raster__2024__ortofoto_norte',
      'raster',
      'ortofoto_norte',
    );
  });

  it('aceita arquivo na raiz (sem subpasta)', async () => {
    await sut.publicar('arquivo_raiz.tif');
    expect(geoClient.criaDataStoreGeoTiff).toHaveBeenCalledWith(
      'arquivo_raiz',
      'raster',
      '/opt/geoserver_data/raster/arquivo_raiz.tif',
    );
    expect(geoClient.publicarCamadaGeoTiff).toHaveBeenCalledWith(
      'arquivo_raiz',
      'raster',
      'arquivo_raiz',
    );
  });

  it('é case-insensitive para extensão .TIF', async () => {
    await sut.publicar('upload_raster/ortofoto.TIF');
    expect(geoClient.criaDataStoreGeoTiff).toHaveBeenCalledWith(
      'upload_raster__ortofoto',
      'raster',
      expect.stringContaining('ortofoto.TIF'),
    );
    expect(geoClient.publicarCamadaGeoTiff).toHaveBeenCalledWith(
      'upload_raster__ortofoto',
      'raster',
      'ortofoto',
    );
  });

  it('usa basename como nativeName mesmo em subpasta profunda (regressão: GeoServer rejeita nativeName que não bate com a coverage do arquivo)', async () => {
    await sut.publicar('ortofotos/2024/litoral/sul.tif');

    expect(geoClient.publicarCamadaGeoTiff).toHaveBeenCalledWith(
      'ortofotos__2024__litoral__sul',
      'raster',
      'sul',
    );
  });

  it('configura o tile cache do GWC para a camada raster recém-publicada', async () => {
    await sut.publicar('upload_raster/orto.tif');
    expect(geoClient.configurarTileCacheRaster).toHaveBeenCalledWith(
      'upload_raster__orto',
    );
  });
});
