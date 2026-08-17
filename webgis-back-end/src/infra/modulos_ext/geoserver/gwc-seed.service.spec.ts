import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GwcSeedService, GwcHttpClient } from './gwc-seed.service';

describe('GwcSeedService', () => {
  let http: GwcHttpClient;
  let sut: GwcSeedService;

  beforeEach(() => {
    http = {
      post: vi.fn().mockResolvedValue({ status: 200 }),
      get: vi.fn(),
    };
    sut = new GwcSeedService(http, {
      baseUrl: 'http://geoserver:8080/geoserver',
      threadCount: 2,
      maxZoom: 16,
    });
  });

  it('POSTs a well-formed seedRequest to the GWC REST endpoint', async () => {
    await sut.startSeed('upload_raster__orto', {
      minx: 380000,
      miny: 7100000,
      maxx: 420000,
      maxy: 7140000,
      crs: 'EPSG:31983',
    });

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body] = (http.post as any).mock.calls[0];
    expect(url).toBe(
      'http://geoserver:8080/geoserver/gwc/rest/seed/content:upload_raster__orto.json',
    );
    expect(body.seedRequest.name).toBe('content:upload_raster__orto');
    expect(body.seedRequest.gridSetId).toBe('EPSG:900913');
    expect(body.seedRequest.format).toBe('image/jpeg');
    expect(body.seedRequest.type).toBe('seed');
    expect(body.seedRequest.zoomStart).toBe(0);
    expect(body.seedRequest.zoomStop).toBe(16);
    expect(body.seedRequest.threadCount).toBe(2);
    expect(body.seedRequest.srs.number).toBe(3857);
    // bbox reprojected from EPSG:31983 to EPSG:3857 — non-zero, distinct from input
    const coords = body.seedRequest.bounds.coords.double as number[];
    expect(coords).toHaveLength(4);
    expect(coords[0]).not.toBe(380000);
    expect(coords[2]).toBeGreaterThan(coords[0]);
    expect(coords[3]).toBeGreaterThan(coords[1]);
  });

  it('passes bbox through unchanged when already in EPSG:3857', async () => {
    await sut.startSeed('layer', {
      minx: -5000000,
      miny: -3000000,
      maxx: -4900000,
      maxy: -2900000,
      crs: 'EPSG:3857',
    });
    const body = (http.post as any).mock.calls[0][1];
    const coords = body.seedRequest.bounds.coords.double;
    expect(coords).toEqual([-5000000, -3000000, -4900000, -2900000]);
  });

  it('computes percent from long-array-array payload', async () => {
    (http.get as any).mockResolvedValue({
      // [processed, total, remainingSec, taskId, status]
      data: {
        'long-array-array': [
          [900, 1000, 100, 1, 1],
          [500, 500, 0, 2, 2],
        ],
      },
    });
    const result = await sut.getSeedProgress('layer');
    // processed (900 + 500) / total (1000 + 500) = 1400/1500 = 93
    expect(result.percent).toBe(93);
    // one task still RUNNING (status 1) -> overall seeding
    expect(result.status).toBe('seeding');
  });

  it('reports cached when every task has status DONE (2)', async () => {
    (http.get as any).mockResolvedValue({
      data: {
        'long-array-array': [
          [1000, 1000, 0, 1, 2],
          [500, 500, 0, 2, 2],
        ],
      },
    });
    const result = await sut.getSeedProgress('layer');
    expect(result.percent).toBe(100);
    expect(result.status).toBe('cached');
  });

  it('reports failed when any task has status ABORTED (-1)', async () => {
    (http.get as any).mockResolvedValue({
      data: { 'long-array-array': [[1000, 1000, 0, 1, -1]] },
    });
    const result = await sut.getSeedProgress('layer');
    expect(result.status).toBe('failed');
  });

  it('returns percent=0 and status=idle on empty payload', async () => {
    (http.get as any).mockResolvedValue({ data: { 'long-array-array': [] } });
    const result = await sut.getSeedProgress('layer');
    expect(result.percent).toBe(0);
    expect(result.status).toBe('idle');
  });
});
