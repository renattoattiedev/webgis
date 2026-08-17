import { Injectable } from '@nestjs/common';
import proj4 from 'proj4';

export interface BoundingBox {
  minx: number;
  miny: number;
  maxx: number;
  maxy: number;
  crs: string;
}

export type SeedStatus = 'idle' | 'seeding' | 'cached' | 'failed';

export interface GwcSeedOptions {
  baseUrl: string; // e.g. http://geoserver:8080/geoserver
  threadCount: number;
  maxZoom: number;
  auth?: { username: string; password: string };
}

export interface GwcHttpClient {
  post(
    url: string,
    body: any,
    auth?: { username: string; password: string },
  ): Promise<any>;
  get(
    url: string,
    auth?: { username: string; password: string },
  ): Promise<{ data: any }>;
}

// Brazil — EPSG:31983 (SIRGAS 2000 / UTM 24S). Register once.
if (!proj4.defs('EPSG:31983')) {
  proj4.defs(
    'EPSG:31983',
    '+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  );
}

@Injectable()
export class GwcSeedService {
  constructor(
    private readonly http: GwcHttpClient,
    private readonly options: GwcSeedOptions,
  ) {}

  async startSeed(nomeFlat: string, bbox: BoundingBox): Promise<void> {
    const layerName = `content:${nomeFlat}`;
    const [minx, miny, maxx, maxy] = this.reprojectTo3857(bbox);

    const body = {
      seedRequest: {
        name: layerName,
        srs: { number: 3857 },
        bounds: { coords: { double: [minx, miny, maxx, maxy] } },
        gridSetId: 'EPSG:900913',
        zoomStart: 0,
        zoomStop: this.options.maxZoom,
        format: 'image/jpeg',
        type: 'seed',
        threadCount: this.options.threadCount,
      },
    };

    const url = `${this.options.baseUrl}/gwc/rest/seed/${layerName}.json`;
    await this.http.post(url, body, this.options.auth);
  }

  async getSeedProgress(
    nomeFlat: string,
  ): Promise<{ percent: number; status: SeedStatus }> {
    const layerName = `content:${nomeFlat}`;
    const url = `${this.options.baseUrl}/gwc/rest/seed/${layerName}.json`;
    const { data } = await this.http.get(url, this.options.auth);
    const rows: number[][] = data?.['long-array-array'] ?? [];

    if (rows.length === 0) {
      return { percent: 0, status: 'idle' };
    }

    const totalProcessed = rows.reduce((a, r) => a + (r[0] ?? 0), 0);
    const totalTiles = rows.reduce((a, r) => a + (r[1] ?? 0), 0);
    const percent =
      totalTiles > 0 ? Math.floor((totalProcessed / totalTiles) * 100) : 0;

    const statuses = rows.map((r) => r[4]);
    if (statuses.some((s) => s === -1)) return { percent, status: 'failed' };
    if (statuses.every((s) => s === 2))
      return { percent: 100, status: 'cached' };
    return { percent, status: 'seeding' };
  }

  private reprojectTo3857(bbox: BoundingBox): [number, number, number, number] {
    if (bbox.crs === 'EPSG:3857') {
      return [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy];
    }
    const [minx, miny] = proj4(bbox.crs, 'EPSG:3857', [bbox.minx, bbox.miny]);
    const [maxx, maxy] = proj4(bbox.crs, 'EPSG:3857', [bbox.maxx, bbox.maxy]);
    return [minx, miny, maxx, maxy];
  }
}
