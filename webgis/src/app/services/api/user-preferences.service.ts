import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  map,
  of,
  throwError,
} from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import {
  CreateUserPreferencePayload,
  UpdateUserPreferencePayload,
  UserPreferenceDTO,
  UserPreferenceResponse,
  SelectedLayerRef,
} from '../../models/user-preferences.model';
import { Map as OlMap } from 'ol';
import { MapaService } from 'src/app/services/mapa.service';
import { ConteudoService } from './conteudo.service';

@Injectable({
  providedIn: 'root',
})
export class UserPreferencesService {
  private preferenceSubject = new BehaviorSubject<UserPreferenceDTO | null>(
    null,
  );
  preference$ = this.preferenceSubject.asObservable();
  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();
  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
    private mapaService: MapaService,
    private conteudoService: ConteudoService,
  ) {}

  private buildHeaders(): HttpHeaders {
    const token = this.cookieService.get('access_token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getCurrentPreference(): UserPreferenceDTO | null {
    return this.preferenceSubject.getValue();
  }

  /** Load user preference from backend */
  fetchPreference(): Observable<UserPreferenceDTO | null> {
    this.loadingSubject.next(true);
    const url = this.getConfigService.getUrl('user-preferences');
    return this.http
      .get<UserPreferenceResponse>(url, { headers: this.buildHeaders() })
      .pipe(
        map((res) => {
          if (res.success && res.preference) {
            this.preferenceSubject.next(res.preference);
            this.errorSubject.next(null);
            return res.preference;
          }
          this.preferenceSubject.next(null);
          return null;
        }),
        catchError((err) => {
          console.warn('Falha ao carregar preferências:', err);
          this.errorSubject.next('Erro ao carregar preferências');
          this.loadingSubject.next(false);
          return of(null);
        }),
        map((pref) => {
          this.loadingSubject.next(false);
          return pref;
        }),
      );
  }

  /** Create new preference */
  createPreference(
    payload: CreateUserPreferencePayload,
  ): Observable<UserPreferenceDTO> {
    const url = this.getConfigService.getUrl('user-preferences');
    return this.http
      .post<UserPreferenceResponse>(url, payload, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((res) => {
          if (!res.success || !res.preference)
            throw new Error(res.message || 'Falha ao criar preferência');
          this.preferenceSubject.next(res.preference);
          return res.preference;
        }),
        catchError((err) => {
          console.error('Erro ao criar preferência:', err);
          return throwError(() => new Error('Erro ao criar preferência'));
        }),
      );
  }

  /** Update existing preference */
  updatePreference(
    payload: UpdateUserPreferencePayload,
  ): Observable<UserPreferenceDTO> {
    const url = this.getConfigService.getUrl('user-preferences');
    return this.http
      .put<UserPreferenceResponse>(url, payload, {
        headers: this.buildHeaders(),
      })
      .pipe(
        map((res) => {
          if (!res.success || !res.preference)
            throw new Error(res.message || 'Falha ao atualizar preferência');
          this.preferenceSubject.next(res.preference);
          return res.preference;
        }),
        catchError((err) => {
          console.error('Erro ao atualizar preferência:', err);
          return throwError(() => new Error('Erro ao atualizar preferência'));
        }),
      );
  }

  /** Delete preference */
  deletePreference(): Observable<boolean> {
    const url = this.getConfigService.getUrl('user-preferences');
    return this.http
      .delete<UserPreferenceResponse>(url, { headers: this.buildHeaders() })
      .pipe(
        map((res) => {
          if (!res.success)
            throw new Error(res.message || 'Falha ao excluir preferência');
          this.preferenceSubject.next(null);
          return true;
        }),
        catchError((err) => {
          console.error('Erro ao excluir preferência:', err);
          return throwError(() => new Error('Erro ao excluir preferência'));
        }),
      );
  }

  /** Capture current map & layer state (unified selectedLayers) */
  captureCurrentState(): CreateUserPreferencePayload {
    const map = this.mapaService.getMapa();
    let zoom: number | null = null;
    let centerX: number | null = null;
    let extent: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    } | null = null;

    if (map) {
      const view = map.getView();
      zoom = view.getZoom() ?? null;
      const center = view.getCenter();
      if (center) centerX = center[0];
      const e = view.calculateExtent(map.getSize());
      if (e) extent = { minX: e[0], minY: e[1], maxX: e[2], maxY: e[3] };
    }

    const selectedLayers: SelectedLayerRef[] = [];
    this.conteudoService.dadosAdicionais.forEach((item: any) => {
      if (!item.ativo) return; // captura apenas ativos
      selectedLayers.push({
        id: item.id,
        grupoId: item.grupoConteudo || '',
        temaId: item.temaId || '',
        tipo:
          item.tipoConteudo === 'camada'
            ? 'V'
            : item.tipoConteudo === 'raster'
              ? 'R'
              : 'M',
      });
    });

    return {
      selectedLayers,
      zoom,
      centerX,
      extent,
    };
  }

  /** Apply stored preference: just map zoom/center here; layer activation delegated externally */
  applyPreference(pref: UserPreferenceDTO | null): void {
    if (!pref) return;
    const map = this.mapaService.getMapa();
    if (map) {
      const view = map.getView();
      try {
        // Aplica extent primeiro (se existir e válido) para garantir posição geral
        if (pref.extent) {
          const { minX, minY, maxX, maxY } = pref.extent;
          const valid = [minX, minY, maxX, maxY].every(
            (v) => typeof v === 'number' && isFinite(v),
          );
          if (valid && maxX > minX && maxY > minY) {
            view.fit([minX, minY, maxX, maxY], {
              size: map.getSize(),
              padding: [20, 20, 20, 20],
            });
          }
        }
        // Aplica zoom específico (se fornecido) após o fit para não ser sobrescrito
        if (pref.zoom != null && isFinite(pref.zoom)) {
          view.setZoom(pref.zoom);
        }
        // Ajusta apenas eixo X do centro se fornecido
        if (pref.centerX != null && isFinite(pref.centerX)) {
          const currentCenter = view.getCenter();
          if (currentCenter) {
            view.setCenter([pref.centerX, currentCenter[1]]);
          }
        }
        // Atualiza escala derivada da resolução atual
        this.updateScaleFromView(map);
        // Ajuste pós-animação de fit (caso o fit ainda esteja processando)
        setTimeout(() => this.updateScaleFromView(map), 250);
      } catch (e) {
        console.warn('Falha ao aplicar preferências de extent/zoom/center:', e);
      }
    }
  }

  /** Calcula escala a partir da resolução atual do mapa e atualiza BehaviorSubject */
  private updateScaleFromView(map: OlMap): void {
    try {
      const view = map.getView();
      const resolution = view.getResolution();
      if (resolution == null) return;
      const DPI = 96;
      const INCHES_PER_METER = 39.37008;
      const scale = Math.round(resolution * DPI * INCHES_PER_METER);
      this.mapaService.updateScale(scale);
    } catch (e) {
      console.warn(
        'Não foi possível atualizar escala após aplicar preferência:',
        e,
      );
    }
  }
}
