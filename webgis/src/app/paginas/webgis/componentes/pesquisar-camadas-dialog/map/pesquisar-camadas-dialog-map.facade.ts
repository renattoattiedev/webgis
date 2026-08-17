import { Injectable } from '@angular/core';
import { Feature } from 'ol';
import type { Map } from 'ol';
import GeoJSON from 'ol/format/GeoJSON';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import Overlay from 'ol/Overlay';
import { getCenter } from 'ol/extent';
import { register } from 'ol/proj/proj4';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import proj4 from 'proj4';
import * as turf from '@turf/turf';
import { MapaService } from 'src/app/services/mapa.service';

@Injectable({
  providedIn: 'root',
})
export class PesquisarCamadasDialogMapFacade {
  private static readonly HIGHLIGHT_LAYER_KEY = 'pesquisarCamadasHighlight';

  constructor(private mapaService: MapaService) {
    proj4.defs(
      'EPSG:31983',
      '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs',
    );
    register(proj4);
  }

  limparHighlight(): void {
    this.mapaService.removePesquisarHighlight();
  }

  localizarGeometriaNoMapa(geom: unknown): string | null {
    const geometria = geom as turf.helpers.Geometry | undefined;
    if (!geometria) {
      return 'Este registro não possui geometria para localizar no mapa.';
    }
    const map = this.mapaService.getMapa();
    if (!map) {
      return 'Mapa não está disponível.';
    }

    const view = map.getView();
    const featureProjection = view.getProjection();
    const geoJsonFormat = new GeoJSON();
    const useFitExtent = this.isPolygonOrLineType(geometria);

    const coords0 = this.getFirstCoordinate(geometria);
    if (!coords0) {
      return 'Não foi possível obter coordenadas da geometria.';
    }

    const [x, y] = coords0;
    const isLikely4326 = x >= -180 && x <= 180 && y >= -90 && y <= 90;
    const MERCATOR_MAX = 20037508.34;
    const isLikely3857 =
      !isLikely4326 &&
      x >= -MERCATOR_MAX &&
      x <= MERCATOR_MAX &&
      y >= -MERCATOR_MAX &&
      y <= MERCATOR_MAX;

    const dataProjection = isLikely3857
      ? featureProjection.getCode()
      : isLikely4326
        ? 'EPSG:4326'
        : 'EPSG:31983';

    const olFeature = this.readFeature(
      geoJsonFormat,
      geometria,
      dataProjection,
      featureProjection.getCode(),
    );
    if (!olFeature) {
      return `Erro ao converter coordenadas (${dataProjection}).`;
    }
    const olGeom = olFeature.getGeometry();
    if (!olGeom) return 'Geometria inválida.';

    const center3857 = getCenter(olGeom.getExtent()) as [number, number];

    if (!Number.isFinite(center3857[0]) || !Number.isFinite(center3857[1])) {
      return 'Coordenadas inválidas para localizar no mapa.';
    }

    this.limparHighlight();

    if (useFitExtent) {
      this.mostrarHighlightGeometria(map, olFeature, center3857);
      view.fit(olGeom.getExtent(), {
        duration: 400,
        padding: [60, 60, 60, 60],
        maxZoom: 18,
      });
    } else {
      this.mostrarHighlight(map, center3857);
      view.animate({ center: center3857, zoom: 17, duration: 400 });
    }
    return null;
  }

  private isPolygonOrLineType(geom: turf.helpers.Geometry): boolean {
    return [
      'Polygon',
      'MultiPolygon',
      'LineString',
      'MultiLineString',
    ].includes(geom.type);
  }

  private readFeature(
    format: GeoJSON,
    geometria: turf.helpers.Geometry,
    dataProjection: string,
    featureProjection: string,
  ): Feature | null {
    try {
      return format.readFeature(
        { type: 'Feature', geometry: geometria, properties: {} },
        { dataProjection, featureProjection },
      ) as Feature;
    } catch {
      return null;
    }
  }

  private mostrarHighlight(map: Map, center3857: [number, number]): void {
    const source = new VectorSource({
      features: [new Feature({ geometry: new Point(center3857) })],
    });
    const layer = new VectorLayer({
      source,
      style: new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: 'rgba(255, 165, 0, 0.6)' }),
          stroke: new Stroke({ color: '#ff9800', width: 3 }),
        }),
      }),
    });
    layer.set(PesquisarCamadasDialogMapFacade.HIGHLIGHT_LAYER_KEY, true);
    map.addLayer(layer);
    this.adicionarBotaoFechar(map, center3857, layer);
  }

  private mostrarHighlightGeometria(
    map: Map,
    olFeature: Feature,
    center3857: [number, number],
  ): void {
    const source = new VectorSource({ features: [olFeature] });
    const layer = new VectorLayer({
      source,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 165, 0, 0.15)' }),
        stroke: new Stroke({ color: '#ff9800', width: 3 }),
      }),
    });
    layer.set(PesquisarCamadasDialogMapFacade.HIGHLIGHT_LAYER_KEY, true);
    map.addLayer(layer);
    this.adicionarBotaoFechar(map, center3857, layer);
  }

  private adicionarBotaoFechar(
    map: Map,
    position: [number, number],
    layer: VectorLayer<VectorSource>,
  ): void {
    const closeEl = document.createElement('div');
    closeEl.className = 'pesquisar-camadas-highlight-close';
    closeEl.innerHTML = '×';
    closeEl.title = 'Remover destaque';
    closeEl.addEventListener('click', () =>
      this.mapaService.removePesquisarHighlight(),
    );

    const overlay = new Overlay({
      element: closeEl,
      position,
      positioning: 'bottom-left',
      offset: [6, -6],
    });
    map.addOverlay(overlay);
    this.mapaService.setPesquisarHighlight(layer, overlay);
  }

  private getFirstCoordinate(
    geom: turf.helpers.Geometry,
  ): [number, number] | null {
    if (
      geom.type === 'Point' &&
      Array.isArray(geom.coordinates) &&
      geom.coordinates.length >= 2
    ) {
      return [Number(geom.coordinates[0]), Number(geom.coordinates[1])];
    }
    try {
      const centroid = turf.centroid(
        turf.feature(geom as turf.helpers.Geometry),
      );
      const c = centroid.geometry.coordinates as number[];
      return [Number(c[0]), Number(c[1])];
    } catch {
      return null;
    }
  }
}
