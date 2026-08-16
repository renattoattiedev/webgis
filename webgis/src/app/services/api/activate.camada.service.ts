import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Camadas } from '../../models/camadas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class ActivateCamadaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  activateCamada(
    camadaId: string,
    tipo: string,
    action: string,
  ): Observable<boolean> {
    const url = this.getConfigService.getUrl('activate-camada');
    const token = this.cookieService.get('access_token');

    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      const finalUrl = `${url}/${camadaId}?tipo=${tipo}&action=${action}`;

      return this.http.put<Camadas>(finalUrl, null, { headers }).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Erro ao ativar a camada:', error);
          return of(false);
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(false);
    }
  }
}
