import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Basemap, BasemapUpsertRequest } from '../../models/basemap.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreateBasemapService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  createBasemap(payload: BasemapUpsertRequest): Observable<Basemap> {
    const url = this.getConfigService.getUrl('create-basemap');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      return this.http.post<Basemap>(url, payload, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao criar basemap:', error);
          return throwError(() => new Error('Erro ao criar basemap'));
        }),
      );
    }

    console.error('Token não encontrado no cookie ou URL inválida');
    return throwError(
      () => new Error('Token não encontrado no cookie ou URL inválida'),
    );
  }
}
