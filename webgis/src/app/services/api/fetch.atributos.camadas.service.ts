import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Atributos, RespostaApi } from '../../models/atributos.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchAtributosService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getAtributos(idCamada: string): Observable<Atributos[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-atributos-camadas');

    const url = `${baseUrl}/${idCamada}`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(url, { headers }).pipe(
      map((data) => data.atributos),
      catchError((error) => {
        console.error('Erro ao buscar atributos:', error);
        return throwError(() => new Error('Erro ao buscar atributos'));
      }),
    );
  }

  getAtributosManager(idCamada: string): Observable<Atributos[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-atributos-manager');

    const url = `${baseUrl}/${idCamada}`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(url, { headers }).pipe(
      map((data) => data.atributos),
      catchError((error) => {
        console.error('Erro ao buscar atributos do manager:', error);
        return throwError(
          () => new Error('Erro ao buscar atributos do manager'),
        );
      }),
    );
  }
}
