import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import { Basemap, BasemapResponse } from 'src/app/models/basemap.model';

@Injectable({
  providedIn: 'root',
})
export class FetchBasemapsService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getBasemaps(): Observable<Basemap[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-basemaps');

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    const params = new HttpParams().set('_t', Date.now().toString());

    return this.http.get<BasemapResponse>(baseUrl, { headers, params }).pipe(
      map((data) => data.basemaps),
      catchError((error) => {
        console.error('Erro ao buscar basemaps:', error);
        return throwError(() => new Error('Erro ao buscar basemaps'));
      }),
    );
  }
}
