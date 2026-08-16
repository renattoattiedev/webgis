import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, catchError, throwError } from 'rxjs';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class GetAcessosCamadaRaster {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getAcessosCamadaRaster(camadaId: string): Observable<{ acessos: number }> {
    const baseUrl = this.getConfigService.getUrl('get-acessos-camada-raster');

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<{ acessos: number }>(`${baseUrl}/${camadaId}`, { headers })
      .pipe(
        catchError((error) => {
          console.error('Erro ao buscar acessos da camada Raster:', error);
          return throwError(
            () => new Error('Erro ao buscar acessos da camada Raster'),
          );
        }),
      );
  }
}
