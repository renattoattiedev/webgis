import { Injectable } from '@angular/core';
import { Map } from 'ol';
import type { Overlay } from 'ol';
import ImageLayer from 'ol/layer/Image';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import { BehaviorSubject, filter, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapaService {
  private clearMapSubject = new Subject<void>();
  private mapSubject = new BehaviorSubject<Map | undefined>(undefined);
  private map: Map | undefined;
  mapaInicializado$: any;
  private swipeEnabledSubject = new BehaviorSubject<boolean>(false);
  swipeEnabled$ = this.swipeEnabledSubject.asObservable();
  private identifyEnabledSubject = new BehaviorSubject<boolean>(true);
  identifyEnabled$ = this.identifyEnabledSubject.asObservable();
  private scaleSubject = new BehaviorSubject<number>(900000); // Inicializa com 900000
  private manualZoomSubject = new BehaviorSubject<boolean>(false);
  private basemapSubject = new BehaviorSubject<string | null>(null);
  /** Highlight do "Pesquisar por camadas" (círculo + overlay com botão fechar). */
  private pesquisarHighlightLayer: VectorLayer<VectorSource> | null = null;
  private pesquisarHighlightOverlay: Overlay | null = null;
  setMapa(mapa: Map) {
    this.map = mapa;
    this.mapSubject.next(mapa);
  }

  getMapa(): Map | null {
    if (!this.map) {
      return null;
    }
    return this.map;
  }

  getMapaObservable(): Observable<Map> {
    return this.mapSubject
      .asObservable()
      .pipe(filter((map): map is Map => map !== undefined));
  }

  get clearMap$(): Observable<void> {
    return this.clearMapSubject.asObservable();
  }

  requestClearMap() {
    this.clearMapSubject.next();
  }

  getAvailableLayers(): ImageLayer<any>[] {
    const map = this.mapSubject.getValue();
    if (!map) {
      throw new Error('Mapa não inicializado');
    }

    return map
      .getLayers()
      .getArray()
      .filter((layer): layer is ImageLayer<any> => layer instanceof ImageLayer);
  }

  setSwipeEnabled(isEnabled: boolean) {
    this.swipeEnabledSubject.next(isEnabled);
  }

  getSwipeEnabled(): boolean {
    return this.swipeEnabledSubject.getValue();
  }

  updateScale(scale: number): void {
    console.log(`MapaService: Atualizando escala para ${scale}`);
    this.scaleSubject.next(scale);
  }

  getScaleObservable(): Observable<number> {
    return this.scaleSubject.asObservable();
  }

  getCurrentScale(): number {
    return this.scaleSubject.getValue();
  }

  /** Identify interaction toggle */
  setIdentifyEnabled(isEnabled: boolean): void {
    this.identifyEnabledSubject.next(isEnabled);
  }

  getIdentifyEnabled(): boolean {
    return this.identifyEnabledSubject.getValue();
  }

  setManualZoom(isManual: boolean): void {
    console.log(
      `MapaService: Zoom manual ${isManual ? 'ativado' : 'desativado'}`,
    );
    this.manualZoomSubject.next(isManual);
  }

  getManualZoomObservable(): Observable<boolean> {
    return this.manualZoomSubject.asObservable();
  }

  resetManualZoom(): void {
    this.setManualZoom(false);
  }

  /** Basemap state */
  updateBasemap(urlTemplate: string): void {
    this.basemapSubject.next(urlTemplate);
  }

  getBasemapObservable(): Observable<string | null> {
    return this.basemapSubject.asObservable();
  }

  setPesquisarHighlight(
    layer: VectorLayer<VectorSource>,
    overlay: Overlay,
  ): void {
    this.removePesquisarHighlight();
    this.pesquisarHighlightLayer = layer;
    this.pesquisarHighlightOverlay = overlay;
  }

  removePesquisarHighlight(): void {
    const map = this.getMapa();
    if (map) {
      if (this.pesquisarHighlightOverlay) {
        map.removeOverlay(this.pesquisarHighlightOverlay);
        this.pesquisarHighlightOverlay = null;
      }
      if (this.pesquisarHighlightLayer) {
        map.removeLayer(this.pesquisarHighlightLayer);
        this.pesquisarHighlightLayer = null;
      }
    }
  }
}
