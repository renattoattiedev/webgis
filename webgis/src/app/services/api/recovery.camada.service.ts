import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Camadas } from '../../models/camadas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class RecoveryCamadaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  recoveryCamada(camadaId: string): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('recovery-camada');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      const url = `${baseUrl}/${camadaId}`;
      return this.http.put<Camadas>(url, {}, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao recuperar a camada:', error);
          return throwError(() => new Error('Erro ao recuperar a camada'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }
}
