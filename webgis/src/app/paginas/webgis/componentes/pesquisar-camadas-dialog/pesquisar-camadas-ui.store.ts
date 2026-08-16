import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface PesquisarCamadasUiState {
  aberto: boolean;
  compacto: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PesquisarCamadasUiStore {
  private readonly stateSubject = new BehaviorSubject<PesquisarCamadasUiState>({
    aberto: false,
    compacto: false,
  });

  readonly state$ = this.stateSubject.asObservable();

  get state(): PesquisarCamadasUiState {
    return this.stateSubject.value;
  }

  abrir(): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      aberto: true,
      compacto: false,
    });
  }

  fechar(): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      aberto: false,
      compacto: false,
    });
  }

  toggleCompacto(): void {
    this.stateSubject.next({
      ...this.stateSubject.value,
      compacto: !this.stateSubject.value.compacto,
    });
  }
}
