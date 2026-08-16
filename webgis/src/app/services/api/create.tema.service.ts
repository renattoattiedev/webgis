import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Tema } from '../../models/temas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreateTemaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  createTema(tema: Tema): Observable<Tema> {
    const url = this.getConfigService.getUrl('create-tema');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      return this.http.post<Tema>(url, tema, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao criar o tema:', error);
          return throwError(() => new Error('Erro ao criar o tema'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return throwError(
        () => new Error('Token não encontrado no cookie ou URL inválida'),
      );
    }
  }
}
