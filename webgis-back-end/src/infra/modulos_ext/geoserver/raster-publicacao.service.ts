import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { GeoserverAPI } from './geoserver-api';

@Injectable()
export class RasterPublicacaoService {
  private geoserverRasterPath = '/opt/geoserver_data/raster';

  constructor(private readonly geoserverClient: GeoserverAPI) {}

  setGeoserverRasterPath(absolutePath: string): void {
    this.geoserverRasterPath = absolutePath;
  }

  async publicar(relativePath: string): Promise<string> {
    const nomeFlat = relativePath
      .replace(/\.tif$/i, '')
      .replace(/[\/\\]/g, '__');
    const filePath = path.posix.join(this.geoserverRasterPath, relativePath);
    const nativeName = path.posix
      .basename(relativePath.replace(/\\/g, '/'))
      .replace(/\.tif$/i, '');

    await this.geoserverClient.criaDataStoreGeoTiff(
      nomeFlat,
      'raster',
      filePath,
    );
    await this.geoserverClient.publicarCamadaGeoTiff(
      nomeFlat,
      'raster',
      nativeName,
    );
    await this.geoserverClient.configurarTileCacheRaster(nomeFlat);

    return nomeFlat;
  }
}
