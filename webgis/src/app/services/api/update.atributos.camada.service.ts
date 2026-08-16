import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Atributos } from '../../models/atributos.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateAtributosCamadaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updateAtributo(atributo: Atributos): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-atributos-camada');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http.put<Atributos>(baseUrl, atributo, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao atualizar atributo da camada:', error);
          return throwError(
            () => new Error('Erro ao atualizar atributo da camada'),
          );
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }
}
