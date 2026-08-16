import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateMapaOwnerService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  changeMapaOwner(idMapa: string, newIdOwner: string): Observable<boolean> {
    const url = this.getConfigService.getUrl('update-mapa-owner');
    const token = this.cookieService.get('access_token');

    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      const body = {
        COD_MAPA_ID: idMapa,
        COD_NEW_OWNER: newIdOwner,
      };

      return this.http.put(url, body, { headers }).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Erro ao mudar o dono do mapa:', error);
          return of(false);
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(false);
    }
  }
}
