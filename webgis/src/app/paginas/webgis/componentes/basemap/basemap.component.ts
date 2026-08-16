import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MapaService } from 'src/app/services/mapa.service';
import {
  BasemapService,
  BasemapOption,
} from 'src/app/services/basemap.service';
import { Basemap } from 'src/app/models/basemap.model';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FetchBasemapsService } from 'src/app/services/api/fetch.basemaps.service';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-basemap',
  templateUrl: './basemap.component.html',
  styleUrls: ['./basemap.component.scss'],
  standalone: true,
  imports: [CommonModule, MatTooltipModule],
})
export class BasemapComponent implements OnInit {
  @ViewChild('mapElement') mapElement!: ElementRef;
  map: Map | undefined;

  expanded = false;
  defaultBasemap!: BasemapOption;
  geoserverBasemaps: BasemapOption[] = [];
  externalBasemaps: BasemapOption[] = this.getFixedBasemaps();

  constructor(
    private mapaService: MapaService,
    private basemapService: BasemapService,
    private fetchBasemapsService: FetchBasemapsService,
  ) {}

  ngOnInit(): void {
    this.defaultBasemap = this.externalBasemaps[0];

    this.loadBasemaps();

    // Atualizar o BasemapService com os basemaps deste componente
    this.basemapService.setBasemaps(this.getAllBasemaps());

    this.mapaService.getMapaObservable().subscribe((mapa) => {
      this.map = mapa;
      const preferredDefaultBasemap = this.getPreferredDefaultBasemap();
      if (preferredDefaultBasemap) {
        this.applyBasemapToMap(preferredDefaultBasemap, false);
        return;
      }
      this.syncDefaultBasemapFromCurrentLayer();
    });

    // Subscribe to basemap changes triggered elsewhere (e.g., dialogs)
    this.mapaService.getBasemapObservable().subscribe((basemapKey) => {
      if (!basemapKey) return;
      const match = this.getAllBasemaps().find(
        (b) => this.getBasemapKey(b) === basemapKey || b.source === basemapKey,
      );
      if (match) {
        this.defaultBasemap = match;
      }
    });

    this.basemapService.getBasemapsRefreshObservable().subscribe(() => {
      this.loadBasemaps();
    });
  }

  toggleExpansion() {
    this.expanded = !this.expanded;
  }

  changeBasemap(selectedBasemap: BasemapOption) {
    this.applyBasemapToMap(selectedBasemap, true);
  }

  private getBasemapKey(basemap: BasemapOption): string {
    if (this.isWmsBasemap(basemap)) {
      return `wms:${basemap.source}?${this.serializeWmsParams(basemap.wmsParams ?? {})}`;
    }

    return `xyz:${basemap.source}`;
  }

  private loadBasemaps(): void {
    this.fetchBasemapsService
      .getBasemaps()
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar basemaps cadastrados:', error);
          return of([]);
        }),
      )
      .subscribe((basemaps) => {
        this.geoserverBasemaps = basemaps
          .filter((basemap: Basemap) => basemap.isActive !== false)
          .sort((a: Basemap, b: Basemap) => {
            const orderDifference =
              (a.order ?? Number.MAX_SAFE_INTEGER) -
              (b.order ?? Number.MAX_SAFE_INTEGER);
            if (orderDifference !== 0) {
              return orderDifference;
            }

            return a.name.localeCompare(b.name);
          })
          .map((basemap: Basemap) => ({
            name: basemap.name,
            thumbnail: basemap.thumbnail,
            source: basemap.source,
            type: 'wms',
            wmsParams: basemap.wmsParams ?? undefined,
            order: basemap.order,
            isDefault: basemap.isDefault,
          }));

        this.basemapService.setBasemaps(this.getAllBasemaps());

        const preferredDefaultBasemap = this.getPreferredDefaultBasemap();
        if (preferredDefaultBasemap) {
          this.defaultBasemap = preferredDefaultBasemap;
          this.applyBasemapToMap(preferredDefaultBasemap, false);
          return;
        }

        if (!this.defaultBasemap && this.getAllBasemaps().length > 0) {
          this.defaultBasemap = this.getAllBasemaps()[0];
        }

        this.syncDefaultBasemapFromCurrentLayer();
      });
  }

  private getPreferredDefaultBasemap(): BasemapOption | null {
    return this.geoserverBasemaps.find((basemap) => basemap.isDefault) ?? null;
  }

  private applyBasemapToMap(
    selectedBasemap: BasemapOption,
    closePanel: boolean,
  ): void {
    if (!selectedBasemap || !selectedBasemap.source) {
      return;
    }

    this.defaultBasemap = selectedBasemap;

    if (!this.map) {
      return;
    }

    const selectedKey = this.getBasemapKey(selectedBasemap);
    const currentKey = this.getBasemapKeyFromLayer(
      this.map.getLayers().item(0) as TileLayer<any> | null,
    );

    if (currentKey !== selectedKey) {
      const source = this.isWmsBasemap(selectedBasemap)
        ? new TileWMS({
            url: selectedBasemap.source,
            params: selectedBasemap.wmsParams ?? {},
            crossOrigin: 'anonymous',
          })
        : new XYZ({
            url: selectedBasemap.source,
            crossOrigin: 'anonymous',
            maxZoom: 19,
          });

      const newBase = new TileLayer({
        source,
        preload: 1,
      });
      newBase.set('transition', 0);
      this.map.getLayers().setAt(0, newBase);
    }

    this.mapaService.updateBasemap(selectedKey);
    if (closePanel) {
      this.expanded = false;
    }
  }

  isSelectedBasemap(basemap: BasemapOption): boolean {
    return (
      this.getBasemapKey(this.defaultBasemap) === this.getBasemapKey(basemap)
    );
  }

  private getAllBasemaps(): BasemapOption[] {
    return [...this.geoserverBasemaps, ...this.externalBasemaps];
  }

  private getFixedBasemaps(): BasemapOption[] {
    return [
      {
        name: 'OpenStreetMap',
        thumbnail: 'https://tile.openstreetmap.org/8/99/142.png',
        source: '/tile-proxy/{z}/{x}/{y}.png',
      },
      {
        name: 'Esri Living Atlas',
        thumbnail:
          'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/8/142/99.png',
        source: '/imagery/tile/{z}/{y}/{x}.png',
      },
      {
        name: 'World Topography',
        thumbnail:
          'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/8/142/99.png',
        source: '/topo/tile/{z}/{y}/{x}.png',
      },
      {
        name: 'World Physical',
        thumbnail:
          'https://services.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer/tile/8/142/99.png',
        source: '/physical/tile/{z}/{y}/{x}.png',
      },
      {
        name: 'World Street',
        thumbnail:
          'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/8/142/99.png',
        source: '/street/tile/{z}/{y}/{x}.png',
      },
    ];
  }

  private syncDefaultBasemapFromCurrentLayer(): void {
    try {
      const baseLayer = this.map?.getLayers().item(0) as TileLayer<any> | null;
      const currentKey = this.getBasemapKeyFromLayer(baseLayer);
      if (currentKey) {
        const match = this.getAllBasemaps().find(
          (b) => this.getBasemapKey(b) === currentKey,
        );
        if (match) {
          this.defaultBasemap = match;
        }
        this.mapaService.updateBasemap(
          match ? this.getBasemapKey(match) : currentKey,
        );
      }
    } catch {}
  }

  private isWmsBasemap(basemap: BasemapOption): boolean {
    return (
      basemap.type === 'wms' ||
      !!basemap.wmsParams ||
      basemap.source.includes('/wms')
    );
  }

  private getBasemapKeyFromLayer(
    baseLayer: TileLayer<any> | null | undefined,
  ): string | null {
    const source: any = baseLayer?.getSource();
    if (!source) return null;

    const url = this.getSourceUrl(source);
    if (!url) return null;

    const isWmsSource = typeof source.getParams === 'function';
    if (isWmsSource) {
      const params = source.getParams() ?? {};
      return `wms:${url}?${this.serializeWmsParams(params)}`;
    }

    return `xyz:${url}`;
  }

  private getSourceUrl(source: any): string | null {
    if (typeof source.getUrls === 'function') {
      const urls = source.getUrls();
      if (Array.isArray(urls) && urls.length > 0) return urls[0];
    }

    if (typeof source.getUrl === 'function') {
      const url = source.getUrl();
      if (typeof url === 'string') return url;
    }

    return source?.url ?? null;
  }

  private serializeWmsParams(params: Record<string, any>): string {
    return Object.entries(params)
      .map(
        ([key, value]) => [String(key).toUpperCase(), String(value)] as const,
      )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }
}
