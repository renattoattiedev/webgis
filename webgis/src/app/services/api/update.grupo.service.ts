import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Grupos } from '../../models/grupo.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateGrupoService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updateGrupo(grupoCamada: Grupos): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-grupo');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http.put<Grupos>(baseUrl, grupoCamada, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao atualizar o grupo de camadas:', error);
          return throwError(
            () => new Error('Erro ao atualizar o grupo de camadas'),
          );
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }
}
