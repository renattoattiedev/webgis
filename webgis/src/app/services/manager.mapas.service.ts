import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Mapas } from 'src/app/models/mapas.model';

@Injectable({
  providedIn: 'root',
})
export class ManagerMapasService {
  private mapaSource = new BehaviorSubject<Mapas | null>(null);
  mapa$ = this.mapaSource.asObservable();

  constructor() {}

  setMapa(mapa: Mapas) {
    this.mapaSource.next(mapa);
  }

  getMapa() {
    return this.mapaSource.value;
  }

  clearMapa() {
    this.mapaSource.next(null);
  }
}
