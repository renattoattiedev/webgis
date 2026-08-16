import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, throwError } from 'rxjs';
import { RespostaApi, Perfil } from '../../models/perfis.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchPerfisService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getPerfis(): Observable<Perfil[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-perfis');

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(baseUrl, { headers }).pipe(
      map((data) => data.perfis),
      catchError((error) => {
        console.error('Erro ao buscar perfis:', error);
        return throwError(() => new Error('Erro ao buscar perfis'));
      }),
    );
  }
}
