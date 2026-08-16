import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import { Mapas, RespostaApi } from 'src/app/models/mapas.model';

@Injectable({
  providedIn: 'root',
})
export class FetchMapasService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getMapas(): Observable<Mapas[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-mapas');

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(baseUrl, { headers }).pipe(
      map((data) => data.mapas),
      catchError((error) => {
        console.error('Erro ao buscar mapas:', error);
        return throwError(() => new Error('Erro ao buscar mapas'));
      }),
    );
  }
}
