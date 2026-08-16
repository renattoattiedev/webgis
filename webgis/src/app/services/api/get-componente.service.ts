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
export class GetComponenteService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
    private cookieService: CookieService,
  ) {}

  getComponente(id: string): Observable<Componente> {
    const baseUrl = this.getConfigService.getUrl('get-componente');
    const url = `${baseUrl}/${id}`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<{ componente: Componente }>(url, { headers }).pipe(
      map((res) => res.componente),
      catchError((error) => {
        console.error('Erro ao buscar componente:', error);
        return throwError(() => new Error('Erro ao buscar componente'));
      }),
    );
  }
}
