import { ConfigService } from '@/config/config.service';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GeoserverOGC {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {}

  private async describeFeatureType(
    typeName: string,
    wfsUrl: string,
  ): Promise<{ attributes: string[]; geometryAttr?: string } | null> {
    if (!wfsUrl) return null;
    try {
      const url = `${wfsUrl}/ows?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=${encodeURIComponent(
        typeName,
      )}`;
      const response = await lastValueFrom(
        this.httpService.get(url, { validateStatus: () => true }),
      );
      const xml =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);
      if (!xml || !xml.includes('<xsd:schema')) return null;

      const elementRegex =
        /<xsd:element[^>]*name="([^"]+)"[^>]*?(?:type="([^"]+)")?[^>]*\/>/g;
      const attributes: string[] = [];
      let geometryAttr: string | undefined;
      let match: RegExpExecArray | null;
      while ((match = elementRegex.exec(xml)) !== null) {
        const name = match[1];
        const type = match[2] || '';
        attributes.push(name);
        if (!geometryAttr && /gml/i.test(type)) geometryAttr = name;
      }
      return { attributes, geometryAttr };
    } catch {
      return null;
    }
  }

  private normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '')
      .toLowerCase();
  }

  private appendCqlFilter(params: URLSearchParams, clause: string): void {
    if (!clause?.trim()) return;
    const current = params.get('cql_filter');
    if (current?.trim()) {
      params.set('cql_filter', `(${current}) AND (${clause})`);
      return;
    }
    params.set('cql_filter', clause);
  }

  private findSoftDeleteAttr(attributes: string[]): string | null {
    if (!attributes?.length) return null;
    const target = 'dhsexclusao';
    const match = attributes.find((attr) => this.normalize(attr) === target);
    return match ?? null;
  }

  async getWFSLayersData(
    layerNames: string[],
    atributos?: any[],
    tipoFiltro?: string,
    criterio?: string,
  ): Promise<any> {
    const wfsUrl = await this.configService.getConfig('GEOSERVER_URL');
    if (!wfsUrl) {
      throw new Error('GEOSERVER_URL não configurada');
    }

    const requests = layerNames.map(async (layerName) => {
      const params = new URLSearchParams();
      const appendBaseParams = () => {
        params.set('service', 'WFS');
        params.set('version', '1.1.0');
        params.set('request', 'GetFeature');
        params.set('typeName', layerName);
        params.set('srsName', 'EPSG:3857');
        params.set('outputFormat', 'application/json');
      };

      appendBaseParams();

      // Map humanized attributes to actual WFS property names
      let geometryAttr = 'geometry';
      let availableAttrs: string[] = [];
      let softDeleteAttr: string | null = null;
      try {
        const ft = await this.describeFeatureType(layerName, wfsUrl);
        if (ft) {
          availableAttrs = ft.attributes || [];
          geometryAttr = ft.geometryAttr || geometryAttr;
          softDeleteAttr = this.findSoftDeleteAttr(availableAttrs);
        }
      } catch {}

      const mapping: Array<{ requested: string; actual: string }> = [];
      if (atributos && atributos.length > 0 && availableAttrs.length > 0) {
        const availNorm = availableAttrs.map((a) => ({
          raw: a,
          norm: this.normalize(a),
        }));
        for (const req of atributos) {
          const normReq = this.normalize(String(req));
          const found = availNorm.find((a) => a.norm === normReq);
          if (found) {
            mapping.push({ requested: String(req), actual: found.raw });
          }
        }
        const actuals = mapping.map((m) => m.actual);
        const hasUnsafe = actuals.some(
          (a) => !/^[A-Za-z_][A-Za-z0-9_]*$/.test(a),
        );
        if (!hasUnsafe && actuals.length > 0) {
          const propertyList = Array.from(new Set([...actuals, geometryAttr]));
          params.set('propertyName', propertyList.join(','));
        }
      }

      let usePost = false;

      if (tipoFiltro === 'coordenadas' && criterio) {
        const parts = criterio.split(';');
        const coords = parts[0].split(',').map(parseFloat);
        const buffer = parseFloat(parts[1]);

        if (coords.length === 2 && !isNaN(buffer)) {
          const [x, y] = coords;
          params.set(
            'cql_filter',
            `DWITHIN(${geometryAttr}, SRID=31984;POINT(${x} ${y}), ${buffer}, meters)`,
          );
          usePost = true;
        }
      } else if (tipoFiltro === 'extensao' && criterio) {
        const [minX, minY, maxX, maxY] = criterio.split(',').map(parseFloat);
        params.set('bbox', `${minX},${minY},${maxX},${maxY},EPSG:4326`);
      } else if (tipoFiltro === 'expressao' && criterio) {
        params.set('cql_filter', criterio);
      } else if (tipoFiltro === 'geometria' && criterio) {
        const geometria =
          typeof criterio === 'string' ? JSON.parse(criterio) : criterio;

        let wktPolygon: string | null = null;
        const srid = geometria?.srid ?? 31984;

        if (geometria?.wkt) {
          wktPolygon = `SRID=${srid};${geometria.wkt}`;
        } else if (
          geometria?.coordinates &&
          Array.isArray(geometria.coordinates)
        ) {
          let coords = geometria.coordinates;

          if (
            geometria.type === 'Polygon' &&
            coords.length > 0 &&
            Array.isArray(coords[0][0])
          ) {
            coords = coords[0];
          }

          const flattened = [...coords];

          if (flattened.length < 3) {
            throw new Error('Polígono deve ter pelo menos 3 pontos');
          }

          const first = flattened[0];
          const last = flattened[flattened.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            flattened.push(first);
          }

          const coordStr = flattened
            .map((coord: [number, number]) => `${coord[0]} ${coord[1]}`)
            .join(', ');

          wktPolygon = `SRID=${srid};POLYGON((${coordStr}))`;
        }

        if (wktPolygon) {
          params.set(
            'cql_filter',
            `INTERSECTS(${geometryAttr}, ${wktPolygon})`,
          );
          usePost = true;
        }
      }

      // Soft delete opcional por camada:
      // aplica apenas se a camada expõe o atributo (ex.: pitometria -> dhs_exclusao)
      if (softDeleteAttr) {
        this.appendCqlFilter(params, `${softDeleteAttr} IS NULL`);
      }

      let response;
      const requestPath = `${wfsUrl}/ows`;

      try {
        if (usePost) {
          response = await lastValueFrom(
            this.httpService.post(requestPath, params.toString(), {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              validateStatus: () => true,
            }),
          );
        } else {
          const requestUrl = `${requestPath}?${params.toString()}`;
          response = await lastValueFrom(
            this.httpService.get(requestUrl, { validateStatus: () => true }),
          );
        }

        if (response.status >= 400) {
          console.error({ layerName, body: response.data });
          return this.createEmptyFeatureCollection();
        }

        const responseData =
          typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data);

        if (
          response.headers['content-type'].includes('xml') ||
          responseData.includes('<ows:ExceptionReport')
        ) {
          return this.createEmptyFeatureCollection();
        }

        let dataOut = response.data;
        // If we couldn't use propertyName due to unsafe names, project properties after fetch
        if (dataOut && mapping.length > 0 && !params.get('propertyName')) {
          try {
            if (
              dataOut.type === 'FeatureCollection' &&
              Array.isArray(dataOut.features)
            ) {
              dataOut = {
                ...dataOut,
                features: dataOut.features.map((feat: any) => {
                  const newProps: Record<string, any> = {};
                  for (const m of mapping) {
                    newProps[m.requested] = feat.properties?.[m.actual];
                  }
                  return { ...feat, properties: newProps };
                }),
              };
            }
          } catch {}
        } else if (dataOut && mapping.length > 0) {
          // Rename keys to requested names for consistency
          try {
            if (
              dataOut.type === 'FeatureCollection' &&
              Array.isArray(dataOut.features)
            ) {
              const actualToRequested = Object.fromEntries(
                mapping.map((m) => [m.actual, m.requested]),
              );
              dataOut = {
                ...dataOut,
                features: dataOut.features.map((feat: any) => {
                  const props = feat.properties || {};
                  const newProps: Record<string, any> = {};
                  for (const key of Object.keys(props)) {
                    const outKey = actualToRequested[key] || key;
                    newProps[outKey] = props[key];
                  }
                  return { ...feat, properties: newProps };
                }),
              };
            }
          } catch {}
        }

        return dataOut ? { layerName, data: dataOut } : null;
      } catch (error: any) {
        console.error({
          layerName,
          params: params.toString().slice(0, 250) + '...',
          status: error.response?.status,
          body: error.response?.data,
        });
        throw new Error(
          `Error fetching WFS data for ${layerName}: ${error.message}`,
        );
      }
    });

    const results = await Promise.all(requests);
    return results.filter((result) => result !== null);
  }

  private createEmptyFeatureCollection() {
    return {
      type: 'FeatureCollection',
      features: [],
      totalFeatures: 0,
      numberMatched: 0,
      numberReturned: 0,
      timeStamp: new Date().toISOString(),
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::3857',
        },
      },
    };
  }
}
