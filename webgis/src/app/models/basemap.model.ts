export type BasemapType = 'xyz' | 'wms';

export type BasemapWmsParams = Record<string, string | number | boolean>;

// Modelo usado no frontend para seleção/troca de basemap
export interface BasemapOption {
  name: string;
  thumbnail: string;
  source: string;
  type?: BasemapType;
  wmsParams?: BasemapWmsParams;
  order?: number;
  isDefault?: boolean;
}

// Modelo de item retornado pelo backend em /basemaps
export interface Basemap {
  id: string;
  name: string;
  thumbnail: string;
  source: string;
  wmsParams: BasemapWmsParams | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BasemapResponse {
  basemaps: Basemap[];
}

export interface BasemapUpsertRequest {
  id?: string;
  name: string;
  thumbnail: string;
  source: string;
  wmsParams: BasemapWmsParams | null;
  order: number;
  isDefault: boolean;
  isActive: boolean;
}
