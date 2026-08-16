import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import {
  Pitometria,
  PitometriaContagem,
  PitometriaFormData,
  TipoPitometria,
} from 'src/app/models/pitometria.model';

@Injectable({ providedIn: 'root' })
export class PitometriaService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
    private cookieService: CookieService,
  ) {}

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.cookieService.get('access_token')}`,
    });
  }

  fetchPitometrias(): Observable<
    { pitometrias: Pitometria[] } & PitometriaContagem
  > {
    const url = this.getConfigService.getUrl('pitometria');
    return this.http
      .get<any>(url)
      .pipe(catchError((err) => throwError(() => err)));
  }

  getPitometriaById(id: string): Observable<Pitometria> {
    const url = this.getConfigService.getUrl(`pitometria/${id}`);
    return this.http.get<{ pitometria: Pitometria }>(url).pipe(
      map((res) => res.pitometria),
      catchError((err) => throwError(() => err)),
    );
  }

  createPitometria(
    data: PitometriaFormData & { longitude: number; latitude: number },
  ): Observable<Pitometria> {
    const url = this.getConfigService.getUrl('pitometria');
    return this.http
      .post<{
        pitometria: Pitometria;
      }>(url, data, { headers: this.authHeaders })
      .pipe(
        map((res) => res.pitometria),
        catchError((err) => throwError(() => err)),
      );
  }

  updatePitometria(
    id: string,
    data: PitometriaFormData,
  ): Observable<Pitometria> {
    const url = this.getConfigService.getUrl(`pitometria/${id}`);
    return this.http
      .put<{ pitometria: Pitometria }>(url, data, { headers: this.authHeaders })
      .pipe(
        map((res) => res.pitometria),
        catchError((err) => throwError(() => err)),
      );
  }

  updateGeometria(
    id: string,
    longitude: number,
    latitude: number,
  ): Observable<void> {
    const url = this.getConfigService.getUrl(`pitometria/${id}/geometry`);
    return this.http
      .patch<void>(url, { longitude, latitude }, { headers: this.authHeaders })
      .pipe(catchError((err) => throwError(() => err)));
  }

  deletePitometria(id: string): Observable<void> {
    const url = this.getConfigService.getUrl(`pitometria/${id}`);
    return this.http
      .delete<void>(url, { headers: this.authHeaders })
      .pipe(catchError((err) => throwError(() => err)));
  }
}
