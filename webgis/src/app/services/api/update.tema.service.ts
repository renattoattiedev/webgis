import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, catchError, of, throwError } from 'rxjs';
import { Tema } from '../../models/temas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateTemaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updateTema(tema: Tema): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-tema');
    const token = this.cookieService.get('access_token');

    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http.put<Tema>(baseUrl, tema, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao atualizar o tema:', error);
          return throwError(() => new Error('Erro ao atualizar o tema'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }
}
