import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';

export type RasterPublicationStatus =
  | 'converting'
  | 'publishing'
  | 'published'
  | 'error'
  | 'unknown';

export type RasterSeedStatus = 'idle' | 'seeding' | 'cached' | 'failed';

export interface RasterPublicationState {
  status: RasterPublicationStatus;
  progress: number;
  error?: string;
  seedStatus?: RasterSeedStatus;
  seedProgress?: number;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class RasterPublicationManagerService {
  private states = new Map<string, BehaviorSubject<RasterPublicationState>>();
  private subscriptions = new Map<string, Subscription>();
  private startTimes = new Map<string, number>();

  constructor(
    private http: HttpClient,
    private cookie: CookieService,
    private config: GetConfigService,
  ) {}

  getState$(camadaId: string): Observable<RasterPublicationState> {
    if (!this.states.has(camadaId)) {
      this.states.set(
        camadaId,
        new BehaviorSubject<RasterPublicationState>({
          status: 'unknown',
          progress: 0,
        }),
      );
    }
    return this.states.get(camadaId)!.asObservable();
  }

  startPolling(camadaId: string): void {
    if (this.subscriptions.has(camadaId)) return;

    if (!this.states.has(camadaId)) {
      this.states.set(
        camadaId,
        new BehaviorSubject<RasterPublicationState>({
          status: 'publishing',
          progress: 0,
        }),
      );
    } else {
      this.states.get(camadaId)!.next({ status: 'publishing', progress: 0 });
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
          const isPublishingDone =
            state.status === 'published' || state.status === 'error';
          const isSeedActive = state.seedStatus === 'seeding';
          if (isPublishingDone && !isSeedActive) {
            this.stopPolling(camadaId);
          }
        },
        error: (e) => {
          console.error(`[RasterPublication] erro polling ${camadaId}:`, e);
          this.states.get(camadaId)!.next({
            status: 'error',
            progress: 0,
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

  private fetchStatus(camadaId: string): Observable<RasterPublicationState> {
    const url = this.config.getUrl(`camadas-raster/${camadaId}/status`);
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.cookie.get('access_token')}`,
    });
    return new Observable<RasterPublicationState>((sub) => {
      this.http.get<any>(url, { headers }).subscribe({
        next: (r) => {
          sub.next({
            status: r.status,
            progress: r.progress ?? 0,
            error: r.error ?? undefined,
            seedStatus: r.seedStatus ?? 'idle',
            seedProgress: r.seedProgress ?? 0,
          });
          sub.complete();
        },
        error: (e) => sub.error(e),
      });
    });
  }
}
