import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Componente,
  RespostaApiComponentes,
} from '../../models/componente.model';
import { GetConfigService } from '../get.config.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class FetchComponenteService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
    private cookieService: CookieService,
  ) {}

  getComponentes(): Observable<Componente[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-componentes');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApiComponentes>(baseUrl, { headers }).pipe(
      map((res) => res.componentes),
      catchError((error) => {
        console.error('Erro ao buscar componentes:', error);
        return throwError(() => new Error('Erro ao buscar componentes'));
      }),
    );
  }
}
