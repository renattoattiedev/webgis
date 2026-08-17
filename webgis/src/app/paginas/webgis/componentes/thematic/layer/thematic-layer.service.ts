import { Injectable } from '@angular/core';
import { Feature } from 'ol';
import type { Map as OlMap } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import { register } from 'ol/proj/proj4';
import VectorSource from 'ol/source/Vector';
import { Extent, createEmpty, extend as extendExtent, isEmpty } from 'ol/extent';
import proj4 from 'proj4';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Camadas } from 'src/app/models/camadas.model';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { MapaService } from 'src/app/services/mapa.service';
import {
  buildLegendModel,
  collectNumericValues,
  resolveDomain,
} from '../classifier/thematic-classifier';
import {
  THEMATIC_LAYER_KEY,
  THEMATIC_NOME_CAMADA_KEY,
  THEMATIC_SPEC_ID_KEY,
  THEMATIC_SPEC_KEY,
  THEMATIC_TITLE_KEY,
  createThematicStyleFunction,
} from '../style/thematic-ol-style';
import {
  ThematicDomain,
  ThematicLegendModel,
  ThematicStyleSpec,
} from '../thematic-style.types';

export interface ThematicLayerHandle {
  id: string;
  layer: VectorLayer<VectorSource>;
  featureCount: number;
  domain: ThematicDomain;
}

const LAYER_ID_PREFIX = 'thematic:';

@Injectable({
  providedIn: 'root',
})
export class ThematicLayerService {
  private readonly handles = new Map<string, ThematicLayerHandle>();
  private readonly legendsSubject = new BehaviorSubject<ThematicLegendModel[]>([]);
  readonly legends$ = this.legendsSubject.asObservable();

  constructor(
    private mapaService: MapaService,
    private conteudoService: ConteudoService,
  ) {
    proj4.defs(
      'EPSG:31983',
      '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs',
    );
    register(proj4);
  }

  layerId(specId: string, nomeCamada: string): string {
    return `${LAYER_ID_PREFIX}${specId}:${nomeCamada}`;
  }

  getHandle(id: string): ThematicLayerHandle | undefined {
    return this.handles.get(id);
  }

  getActiveHandles(): ThematicLayerHandle[] {
    return [...this.handles.values()];
  }

  async addCamada(
    camada: Camadas,
    spec: ThematicStyleSpec,
  ): Promise<ThematicLayerHandle> {
    const map = this.requireMap();
    const id = this.layerId(spec.id, camada.nomeCamada);
    this.removeByNomeCamada(camada.nomeCamada);

    const geojson = await this.fetchGeoJson(camada, spec);
    const features = this.readFeatures(geojson, map);
    const sampleValues = collectNumericValues(features, spec.valueField);
    const domain = resolveDomain(spec, sampleValues);

    const source = new VectorSource({ features });
    const layer = new VectorLayer({
      source,
      style: createThematicStyleFunction(spec, domain, sampleValues),
      zIndex: 250,
    });
    layer.set('id', `content:${camada.nomeCamada}`);
    layer.set('titulo', camada.tituloCamada);
    layer.set(THEMATIC_LAYER_KEY, true);
    layer.set(THEMATIC_SPEC_ID_KEY, spec.id);
    layer.set(THEMATIC_SPEC_KEY, spec);
    layer.set(THEMATIC_TITLE_KEY, camada.tituloCamada);
    layer.set(THEMATIC_NOME_CAMADA_KEY, camada.nomeCamada);

    map.addLayer(layer);

    const handle: ThematicLayerHandle = {
      id,
      layer,
      featureCount: features.length,
      domain,
    };
    this.handles.set(id, handle);
    this.publishLegends();
    return handle;
  }

  removeCamada(specId: string, nomeCamada: string): void {
    this.removeById(this.layerId(specId, nomeCamada));
  }

  removeByNomeCamada(nomeCamada: string): void {
    for (const handle of [...this.handles.values()]) {
      if (handle.layer.get(THEMATIC_NOME_CAMADA_KEY) === nomeCamada) {
        this.removeById(handle.id);
      }
    }
  }

  removeBySpec(specId: string): void {
    for (const handle of [...this.handles.values()]) {
      if (handle.layer.get(THEMATIC_SPEC_ID_KEY) === specId) {
        this.removeById(handle.id);
      }
    }
  }

  clearAll(): void {
    for (const id of [...this.handles.keys()]) {
      this.removeById(id);
    }
  }

  fitToActiveLayers(): void {
    const map = this.mapaService.getMapa();
    if (!map) return;
    const extent = createEmpty();
    for (const handle of this.handles.values()) {
      const layerExtent = handle.layer.getSource()?.getExtent();
      if (layerExtent && !isEmpty(layerExtent)) {
        extendExtent(extent, layerExtent);
      }
    }
    if (!isEmpty(extent) && extent.every(Number.isFinite)) {
      map.getView().fit(extent as Extent, {
        duration: 500,
        padding: [80, 80, 80, 80],
        maxZoom: 16,
      });
    }
  }

  isThematicLayer(layer: unknown): boolean {
    return !!(layer as { get?: (key: string) => unknown })?.get?.(
      THEMATIC_LAYER_KEY,
    );
  }

  private removeById(id: string): void {
    const handle = this.handles.get(id);
    if (!handle) return;
    const map = this.mapaService.getMapa();
    map?.removeLayer(handle.layer);
    handle.layer.getSource()?.clear();
    this.handles.delete(id);
    this.publishLegends();
  }

  private publishLegends(): void {
    const models = [...this.handles.values()].map((handle) => {
      const spec = handle.layer.get(THEMATIC_SPEC_KEY) as ThematicStyleSpec;
      const title = handle.layer.get(THEMATIC_TITLE_KEY) as string;
      return buildLegendModel(spec, handle.domain, title);
    });
    this.legendsSubject.next(models);
  }

  private async fetchGeoJson(
    camada: Camadas,
    _spec: ThematicStyleSpec,
  ): Promise<{ type: 'FeatureCollection'; features: any[] }> {
    const nomes = this.layerNameCandidates(camada.nomeCamada);
    for (const nomeCamada of nomes) {
      const response = await firstValueFrom(
        this.conteudoService.getWFSLayerData('camada', nomeCamada, []),
      );
      const features = this.extractFeatures(response);
      if (features.length) {
        return { type: 'FeatureCollection', features };
      }
    }
    return { type: 'FeatureCollection', features: [] };
  }

  private layerNameCandidates(nomeCamada: string): string[] {
    const clean = nomeCamada.replace(/^content:/, '');
    return [`content:${clean}`, clean];
  }

  private extractFeatures(response: unknown): any[] {
    if (!response) return [];
    if (Array.isArray(response)) {
      for (const item of response) {
        const features =
          item?.data?.features ?? item?.features ?? item?.data ?? null;
        if (Array.isArray(features) && features.length && features[0]?.geometry) {
          return features;
        }
        if (Array.isArray(item?.data?.features)) return item.data.features;
      }
      const first = response[0];
      return first?.data?.features ?? first?.features ?? [];
    }
    const obj = response as Record<string, any>;
    return obj['data']?.features ?? obj['features'] ?? [];
  }

  private readFeatures(
    collection: { type: 'FeatureCollection'; features: any[] },
    map: OlMap,
  ): Feature[] {
    if (!collection.features?.length) return [];
    const format = new GeoJSON();
    const featureProjection = map.getView().getProjection().getCode();
    const detected = this.detectDataProjection(collection.features[0]);
    const projections = [...new Set([detected, 'EPSG:3857', 'EPSG:31983', 'EPSG:4326'])];

    for (const dataProjection of projections) {
      try {
        const features = format.readFeatures(collection, {
          dataProjection,
          featureProjection,
        }) as Feature[];
        const geom = features[0]?.getGeometry();
        const extent = geom?.getExtent();
        if (features.length && extent && extent.every(Number.isFinite)) {
          return features;
        }
      } catch {
        continue;
      }
    }
    return [];
  }

  private detectDataProjection(feature: any): string {
    const coords = this.getFirstCoordinate(feature?.geometry);
    if (!coords) return 'EPSG:3857';
    const [x, y] = coords;
    if (x >= -180 && x <= 180 && y >= -90 && y <= 90) return 'EPSG:4326';
    // SIRGAS 2000 / UTM 24S — valores típicos do ES. Não confundir com Web Mercator.
    if (x >= 100000 && x <= 1000000 && y >= 6000000 && y <= 11000000) {
      return 'EPSG:31983';
    }
    return 'EPSG:3857';
  }

  private getFirstCoordinate(geometry: any): [number, number] | null {
    if (!geometry) return null;
    let coords = geometry.coordinates;
    while (Array.isArray(coords) && Array.isArray(coords[0])) {
      coords = coords[0];
    }
    if (
      Array.isArray(coords) &&
      typeof coords[0] === 'number' &&
      typeof coords[1] === 'number'
    ) {
      return [coords[0], coords[1]];
    }
    return null;
  }

  private requireMap(): OlMap {
    const map = this.mapaService.getMapa();
    if (!map) {
      throw new Error('Mapa não inicializado');
    }
    return map;
  }
}
