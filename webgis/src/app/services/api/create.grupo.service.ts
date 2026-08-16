import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Grupos } from '../../models/grupo.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreateGrupoService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  createGrupo(grupoCamadas: Grupos): Observable<Grupos> {
    const url = this.getConfigService.getUrl('create-grupo');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      return this.http.post<Grupos>(url, grupoCamadas, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao criar o grupo de camadas:', error);
          return throwError(
            () => new Error('Erro ao criar o grupo de camadas'),
          );
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
