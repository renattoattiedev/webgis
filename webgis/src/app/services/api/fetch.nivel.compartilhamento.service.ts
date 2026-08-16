import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  NiveisCompartilhamento,
  RespostaApi,
} from '../../models/niveis.compartilhamento';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchNivelCompartilhamentoService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getNiveis(): Observable<NiveisCompartilhamento[]> {
    const baseUrl = this.getConfigService.getUrl(
      'fetch-nivel-compartilhamento',
    );

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(baseUrl, { headers }).pipe(
      map((data) => data.nivelCompartilhamento),
      catchError((error) => {
        console.error('Erro ao buscar níveis de compartilhamento:', error);
        return throwError(
          () => new Error('Erro ao buscar níveis de compartilhamento'),
        );
      }),
    );
  }
}
