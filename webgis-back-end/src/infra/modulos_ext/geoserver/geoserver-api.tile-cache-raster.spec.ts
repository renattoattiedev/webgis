import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { GeoserverAPI } from './geoserver-api';

vi.mock('axios');

// GeoserverAPI constructor calls `new (NodeCache as any)()` which fails under
// Vite's SSR transform for CJS modules. We bypass this by instantiating via
// Object.create so the NodeCache constructor is never invoked.
function makeGeoserverAPI(configService: any, minioAPI: any): GeoserverAPI {
  const instance = Object.create(GeoserverAPI.prototype) as GeoserverAPI;
  (instance as any).configService = configService;
  (instance as any).minioAPI = minioAPI;
  (instance as any).cache = { get: vi.fn(), set: vi.fn(), del: vi.fn() };
  return instance;
}

describe('GeoserverAPI.configurarTileCacheRaster', () => {
  let configService: any;
  let minioApi: any;
  let sut: GeoserverAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    configService = {
      getConfig: vi.fn(async (key: string) => {
        const map: Record<string, string> = {
          GEOSERVER_USER: 'admin',
          GEOSERVER_PASSWORD: 'geoserver',
          GEOSERVER_URL: 'http://geo:8080/geoserver',
        };
        return map[key];
      }),
    };
    minioApi = {};
    sut = makeGeoserverAPI(configService, minioApi);
  });

  it('PUTs raster tile cache XML to /gwc/rest/layers/content:{name}.xml', async () => {
    (axios.request as any).mockResolvedValue({ status: 200, data: {} });

    await sut.configurarTileCacheRaster('upload_raster__orto');

    expect(axios.request).toHaveBeenCalledTimes(1);
    const call = (axios.request as any).mock.calls[0][0];
    expect(call.method).toBe('PUT');
    expect(call.url).toBe(
      'http://geo:8080/geoserver/gwc/rest/layers/content:upload_raster__orto.xml',
    );
    expect(call.headers['Content-Type']).toBe('application/xml');
    expect(call.auth).toEqual({ username: 'admin', password: 'geoserver' });

    const xml = call.data as string;
    expect(xml).toContain('<name>content:upload_raster__orto</name>');
    expect(xml).toContain('<enabled>true</enabled>');
    expect(xml).toContain('<string>image/jpeg</string>');
    expect(xml).toContain('<string>image/png</string>');
    expect(xml).toContain('<gridSetName>EPSG:900913</gridSetName>');
    expect(xml).toContain('<zoomStart>0</zoomStart>');
    expect(xml).toContain('<zoomStop>18</zoomStop>');
    expect(xml).toContain('<expireCache>2592000</expireCache>');
    expect(xml).toContain('<expireClients>86400</expireClients>');
    expect(xml).toContain('<gutter>0</gutter>');
  });
});
