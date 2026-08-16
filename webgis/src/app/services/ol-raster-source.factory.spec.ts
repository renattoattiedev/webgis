import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { createRasterTileLayer } from './ol-raster-source.factory';

describe('createRasterTileLayer', () => {
  it('returns a TileLayer backed by TileWMS pointing at the integrated WMS+GWC endpoint', () => {
    const layer = createRasterTileLayer('content:my_raster', 'Meu Raster');
    expect(layer).toBeInstanceOf(TileLayer);
    const src = layer.getSource();
    expect(src).toBeInstanceOf(TileWMS);
    const urls = (src as TileWMS).getUrls() || [];
    expect(urls[0]).toBe('/geoserver-proxy/content/wms');
    const params = (src as TileWMS).getParams();
    expect(params['LAYERS']).toBe('content:my_raster');
    expect(params['TILED']).toBe(true);
    expect(params['FORMAT']).toBe('image/png');
    expect(params['TRANSPARENT']).toBe(true);
    expect(layer.getZIndex()).toBeUndefined();
  });

  it('attaches id and titulo properties to the layer', () => {
    const layer = createRasterTileLayer('content:abc', 'Titulo Demo');
    expect(layer.get('id')).toBe('content:abc');
    expect(layer.get('titulo')).toBe('Titulo Demo');
  });

  it('omits titulo property when not provided', () => {
    const layer = createRasterTileLayer('content:noTitle');
    expect(layer.get('titulo')).toBeUndefined();
  });
});
