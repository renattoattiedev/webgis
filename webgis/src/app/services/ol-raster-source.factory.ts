import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import TileGrid from 'ol/tilegrid/TileGrid';

export interface RasterTileLayerOptions {
  format?: string;
  transparent?: boolean;
  tileSize?: number;
  maxZoom?: number;
  zIndex?: number;
}

// GeoServer's default EPSG:900913 (Web Mercator) gridset uses these exact
// numeric bounds — slightly truncated relative to OpenLayers' default
// Web Mercator extent (-20037508.342789244, ...). Tile requests must align
// to this gridset or GWC's standalone endpoint returns 400. Pinning the
// tile grid here lets the integrated WMS endpoint serve from cache when
// alignment matches.
const GWC_900913_EXTENT: [number, number, number, number] = [
  -20037508.34, -20037508.34, 20037508.34, 20037508.34,
];

function buildGwcResolutions(maxZoom: number): number[] {
  const resolutions: number[] = [];
  let r = 156543.03390625; // GWC's EPSG:900913 zoom-0 resolution
  for (let z = 0; z <= maxZoom; z++) {
    resolutions.push(r);
    r /= 2;
  }
  return resolutions;
}

export function createRasterTileLayer(
  camadaId: string,
  titulo?: string,
  options: RasterTileLayerOptions = {},
): TileLayer<TileWMS> {
  const tileSize = options.tileSize ?? 256;
  const maxZoom = options.maxZoom ?? 22;

  const tileGrid = new TileGrid({
    extent: GWC_900913_EXTENT,
    origin: [GWC_900913_EXTENT[0], GWC_900913_EXTENT[3]], // top-left
    resolutions: buildGwcResolutions(maxZoom),
    tileSize,
  });

  const layer = new TileLayer({
    source: new TileWMS({
      // Integrated WMS+GWC endpoint: serves from cache when TILED=true and
      // the BBOX aligns with a cached tile; falls back to a fresh WMS render
      // otherwise. The standalone /gwc/service/wms endpoint is strict about
      // alignment and returns 400 on any mismatch.
      url: '/geoserver-proxy/content/wms',
      params: {
        LAYERS: camadaId,
        TILED: true,
        FORMAT: options.format ?? 'image/png',
        TRANSPARENT: options.transparent ?? true,
      },
      serverType: 'geoserver',
      tileGrid,
      crossOrigin: 'anonymous',
      projection: 'EPSG:3857',
    }),
    preload: 1,
  });
  layer.set('transition', 0);
  layer.set('id', camadaId);
  if (options.zIndex !== undefined) {
    layer.setZIndex(options.zIndex);
  }
  if (titulo !== undefined) layer.set('titulo', titulo);
  return layer;
}
