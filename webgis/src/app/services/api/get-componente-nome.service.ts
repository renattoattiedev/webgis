import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Componente } from 'src/app/models/componente.model';
import { GetConfigService } from '../get.config.service';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
  providedIn: 'root',
})
export class GetComponenteNomeService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
    private cookieService: CookieService,
  ) {}

  getComponenteByNome(nome: string): Observable<Componente> {
    const baseUrl = this.getConfigService.getUrl('get-componente-nome');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    const url = `${baseUrl}?nome=${encodeURIComponent(nome)}`;

    return this.http.get<{ componente: Componente }>(url, { headers }).pipe(
      map((res) => res.componente),
      catchError((error) => {
        console.error('Erro ao buscar componente por nome:', error);
        return throwError(
          () => new Error('Erro ao buscar componente por nome'),
        );
      }),
    );
  }
}
