import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PacotesConceituais } from '../../models/pacotes-conceituais.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreatePacoteConceitualService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  createPacoteConceitual(
    pacotesConceituais: PacotesConceituais,
  ): Observable<PacotesConceituais> {
    const url = this.getConfigService.getUrl('create-pacote-conceitual');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      return this.http
        .post<PacotesConceituais>(url, pacotesConceituais, { headers })
        .pipe(
          catchError((error) => {
            console.error('Erro ao criar o pacote conceitual:', error);
            return throwError(
              () => new Error('Erro ao criar o pacote conceitual'),
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
