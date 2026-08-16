import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, throwError } from 'rxjs';
import { PacotesConceituais } from '../../models/pacotes-conceituais.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdatePacoteConceitualService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updatePacoteConceitual(
    pacoteConceitual: PacotesConceituais,
  ): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-pacote-conceitual');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http
        .put<PacotesConceituais>(baseUrl, pacoteConceitual, { headers })
        .pipe(
          catchError((error) => {
            console.error('Erro ao atualizar o pacote conceitual:', error);
            return throwError(
              () => new Error('Erro ao atualizar o pacote conceitual'),
            );
          }),
        );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }
}
