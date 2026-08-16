import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateCamadaOwnerService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  changeCamadaOwner(idCamada: string, newIdOwner: string): Observable<boolean> {
    const url = this.getConfigService.getUrl('update-camada-owner');
    const token = this.cookieService.get('access_token');

    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      const body = {
        COD_CAMADA_ID: idCamada,
        COD_NEW_OWNER: newIdOwner,
      };

      return this.http.put(url, body, { headers }).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Erro ao mudar o dono da camada:', error);
          return of(false);
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(false);
    }
  }

  changeRasterOwner(idCamada: string, newIdOwner: string): Observable<boolean> {
    const url = this.getConfigService.getUrl('update-camada-raster-owner');
    const token = this.cookieService.get('access_token');

    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      const body = {
        COD_CAMADA_RASTER_ID: idCamada,
        COD_NEW_OWNER: newIdOwner,
      };

      return this.http.put(url, body, { headers }).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Erro ao mudar o dono da camada raster:', error);
          return of(false);
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(false);
    }
  }
}
