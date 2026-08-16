import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Camadas } from 'src/app/models/camadas.model';
import { CamadasRaster } from '../models/camadas.raster.model';

export type LayerType = 'vector' | 'raster';

@Injectable({
  providedIn: 'root',
})
export class AssociateCamadasMapaService {
  private camadasSubject = new BehaviorSubject<Camadas[]>([]);
  private camadasRasterSubject = new BehaviorSubject<CamadasRaster[]>([]);
  private camadaRemovedSubject = new Subject<Camadas | null>();
  private camadaRasterRemovedSubject = new Subject<CamadasRaster | null>();

  // Observables públicos
  public readonly camadas$ = this.camadasSubject.asObservable();
  public readonly camadasRaster$ = this.camadasRasterSubject.asObservable();
  public readonly camadaRemoved$ = this.camadaRemovedSubject.asObservable();
  public readonly camadaRasterRemoved$ =
    this.camadaRasterRemovedSubject.asObservable();

  constructor() {}

  addCamada(camada: Camadas): void {
    const currentLayers = this.camadasSubject.value;
    if (!this.isLayerAlreadyAdded(camada, 'vector')) {
      this.camadasSubject.next([...currentLayers, camada]);
    }
  }

  addCamadaRaster(camadaRaster: CamadasRaster): void {
    const currentLayers = this.camadasRasterSubject.value;
    if (!this.isLayerAlreadyAdded(camadaRaster, 'raster')) {
      this.camadasRasterSubject.next([...currentLayers, camadaRaster]);
    }
  }

  removeCamada(camada: Camadas): void {
    const currentLayers = this.camadasSubject.value;
    const updatedLayers = currentLayers.filter((c) => c.id !== camada.id);
    this.camadasSubject.next(updatedLayers);
    this.camadaRemovedSubject.next(camada);
  }

  removeCamadaRaster(camadaRaster: CamadasRaster): void {
    const currentLayers = this.camadasRasterSubject.value;
    const updatedLayers = currentLayers.filter((c) => c.id !== camadaRaster.id);
    this.camadasRasterSubject.next(updatedLayers);
    this.camadaRasterRemovedSubject.next(camadaRaster);
  }

  getCurrentVectorLayers(): Camadas[] {
    return this.camadasSubject.value;
  }

  getCurrentRasterLayers(): CamadasRaster[] {
    return this.camadasRasterSubject.value;
  }

  private isLayerAlreadyAdded(
    camada: Camadas | CamadasRaster,
    type: LayerType,
  ): boolean {
    const currentLayers =
      type === 'vector'
        ? this.camadasSubject.value
        : this.camadasRasterSubject.value;
    return currentLayers.some((c) => c.id === camada.id);
  }

  clearCamadas(): void {
    this.camadasSubject.next([]);
    this.camadasRasterSubject.next([]);
    this.camadaRemovedSubject.next(null);
    this.camadaRasterRemovedSubject.next(null);
  }

  isVectorLayerAdded(camadaId: string | number): boolean {
    return this.camadasSubject.value.some((c) => c.id === camadaId);
  }

  isRasterLayerAdded(camadaId: string | number): boolean {
    return this.camadasRasterSubject.value.some((c) => c.id === camadaId);
  }

  getVectorLayerById(id: string | number): Camadas | undefined {
    return this.camadasSubject.value.find((c) => c.id === id);
  }

  getRasterLayerById(id: string | number): CamadasRaster | undefined {
    return this.camadasRasterSubject.value.find((c) => c.id === id);
  }

  updateVectorLayer(updatedLayer: Camadas): void {
    const currentLayers = this.camadasSubject.value;
    const updatedLayers = currentLayers.map((layer) =>
      layer.id === updatedLayer.id ? updatedLayer : layer,
    );
    this.camadasSubject.next(updatedLayers);
  }

  updateRasterLayer(updatedLayer: CamadasRaster): void {
    const currentLayers = this.camadasRasterSubject.value;
    const updatedLayers = currentLayers.map((layer) =>
      layer.id === updatedLayer.id ? updatedLayer : layer,
    );
    this.camadasRasterSubject.next(updatedLayers);
  }
}
