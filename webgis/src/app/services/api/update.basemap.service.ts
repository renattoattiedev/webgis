import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, catchError, of, throwError } from 'rxjs';
import { BasemapUpsertRequest } from '../../models/basemap.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateBasemapService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updateBasemap(payload: BasemapUpsertRequest): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-basemap');
    const token = this.cookieService.get('access_token');

    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http.put(baseUrl, payload, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao atualizar basemap:', error);
          return throwError(() => new Error('Erro ao atualizar basemap'));
        }),
      );
    }

    console.error('Token não encontrado no cookie ou URL inválida');
    return of(null);
  }
}
