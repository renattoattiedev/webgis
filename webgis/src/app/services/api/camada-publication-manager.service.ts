import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GetConfigService } from '../get.config.service';

export type CamadaPublicationStatus =
  | 'publishing'
  | 'published'
  | 'error'
  | 'unknown';

export interface CamadaPublicationState {
  status: CamadaPublicationStatus;
  error?: string;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Faz polling do status de republicação de uma camada vetorial — o endpoint
 * de republicar responde 'publishing' na hora (o GeoServer roda em
 * background), então o feedback de sucesso/erro só chega por aqui.
 */
@Injectable({ providedIn: 'root' })
export class CamadaPublicationManagerService {
  private states = new Map<string, BehaviorSubject<CamadaPublicationState>>();
  private subscriptions = new Map<string, Subscription>();
  private startTimes = new Map<string, number>();

  constructor(
    private http: HttpClient,
    private cookie: CookieService,
    private config: GetConfigService,
    private snackBar: MatSnackBar,
  ) {}

  getState$(camadaId: string): Observable<CamadaPublicationState> {
    if (!this.states.has(camadaId)) {
      this.states.set(
        camadaId,
        new BehaviorSubject<CamadaPublicationState>({ status: 'unknown' }),
      );
    }
    return this.states.get(camadaId)!.asObservable();
  }

  startPolling(camadaId: string): void {
    if (this.subscriptions.has(camadaId)) return;

    if (!this.states.has(camadaId)) {
      this.states.set(
        camadaId,
        new BehaviorSubject<CamadaPublicationState>({ status: 'publishing' }),
      );
    } else {
      this.states.get(camadaId)!.next({ status: 'publishing' });
    }

    this.startTimes.set(camadaId, Date.now());

    const sub = interval(POLL_INTERVAL_MS)
      .pipe(
        takeWhile(
          () =>
            Date.now() - (this.startTimes.get(camadaId) ?? 0) < POLL_TIMEOUT_MS,
        ),
        switchMap(() => this.fetchStatus(camadaId)),
      )
      .subscribe({
        next: (state) => {
          this.states.get(camadaId)!.next(state);
          if (state.status === 'published') {
            this.snackBar.open('✔ Camada sobrescrita com sucesso', 'Fechar', {
              duration: 3000,
            });
            this.stopPolling(camadaId);
          } else if (state.status === 'error') {
            this.snackBar.open(
              `❌ ${state.error ?? 'Falha ao sobrescrever a camada'}`,
              'Fechar',
              { duration: 6000 },
            );
            this.stopPolling(camadaId);
          }
        },
        error: (e) => {
          console.error(`[CamadaPublication] erro polling ${camadaId}:`, e);
          this.states.get(camadaId)!.next({
            status: 'error',
            error: 'Falha ao consultar status',
          });
          this.stopPolling(camadaId);
        },
      });

    this.subscriptions.set(camadaId, sub);
  }

  stopPolling(camadaId: string): void {
    this.subscriptions.get(camadaId)?.unsubscribe();
    this.subscriptions.delete(camadaId);
    this.startTimes.delete(camadaId);
  }

  isPolling(camadaId: string): boolean {
    return this.subscriptions.has(camadaId);
  }

  private fetchStatus(camadaId: string): Observable<CamadaPublicationState> {
    const url = this.config.getUrl(`camadas/${camadaId}/status`);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.cookie.get('access_token')}`,
    });
    return new Observable<CamadaPublicationState>((sub) => {
      this.http.get<any>(url, { headers }).subscribe({
        next: (r) => {
          sub.next({ status: r.status, error: r.error ?? undefined });
          sub.complete();
        },
        error: (e) => sub.error(e),
      });
    });
  }
}
