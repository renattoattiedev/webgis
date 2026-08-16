import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Basemap } from 'src/app/models/basemap.model';
import { GetConfigService } from '../get.config.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class GetBasemapService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
    private cookieService: CookieService,
  ) {}

  getBasemap(id: string): Observable<Basemap> {
    const baseUrl = this.getConfigService.getUrl('get-basemap');
    const url = `${baseUrl}/${id}`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<{ basemap: Basemap } | Basemap>(url, { headers }).pipe(
      map((res) => {
        if (typeof res === 'object' && res !== null && 'basemap' in res) {
          return res.basemap;
        }

        return res;
      }),
      catchError((error) => {
        console.error('Erro ao buscar basemap:', error);
        return throwError(() => new Error('Erro ao buscar basemap'));
      }),
    );
  }
}
