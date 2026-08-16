import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Tema, RespostaApi } from '../../models/temas.model';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchTemasService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getTemas(): Observable<Tema[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-temas');

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(baseUrl, { headers }).pipe(
      map((data) => data.temas),
      catchError((error) => {
        console.error('Erro ao buscar temas:', error);
        return throwError(() => new Error('Erro ao buscar temas'));
      }),
    );
  }
}
