import { Basemap } from '@/domain/basemaps/enterprise/entities/basemap';

export class BasemapPresenter {
  static toHTTP(basemap: Basemap) {
    return {
      id: basemap.id.toString(),
      name: basemap.basemapNome,
      thumbnail: basemap.basemapThumbnail,
      source: basemap.basemapSource,
      wmsParams: basemap.basemapWmsParams,
      order: basemap.basemapOrdem,
      isDefault: basemap.basemapDefault,
      isActive: basemap.basemapAtivo,
      createdAt: basemap.createdAt,
      updatedAt: basemap.updatedAt,
    };
  }
}
