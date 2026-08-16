import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BasemapOption, BasemapType } from '../models/basemap.model';

export type { BasemapOption, BasemapType };

@Injectable({
  providedIn: 'root',
})
export class BasemapService {
  private basemapsSubject = new BehaviorSubject<BasemapOption[]>([]);
  private basemapsRefreshSubject = new Subject<void>();
  basemaps$ = this.basemapsSubject.asObservable();
  basemapsRefresh$ = this.basemapsRefreshSubject.asObservable();

  constructor() {
    // Inicializar com basemaps padrão
    this.setBasemaps([
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
    ]);
  }

  setBasemaps(basemaps: BasemapOption[]): void {
    this.basemapsSubject.next(basemaps);
  }

  getBasemaps(): BasemapOption[] {
    return this.basemapsSubject.getValue();
  }

  getBasemapsObservable(): Observable<BasemapOption[]> {
    return this.basemaps$;
  }

  notifyBasemapsChanged(): void {
    this.basemapsRefreshSubject.next();
  }

  getBasemapsRefreshObservable(): Observable<void> {
    return this.basemapsRefresh$;
  }
}
