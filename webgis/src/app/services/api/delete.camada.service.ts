import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Camadas } from '../../models/camadas.model';
import { GetConfigService } from '../get.config.service';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';

@Injectable({
  providedIn: 'root',
})
export class DeleteCamadaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  deleteCamada(camadaId: string): Observable<any> {
    const url = this.getConfigService.getUrl('delete-camada');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const options = {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      };
      return this.http.delete<Camadas>(`${url}/${camadaId}`, options).pipe(
        catchError((error) => {
          console.error('Erro ao deletar a camada:', error);
          // Retorna o erro original do backend mantendo toda a estrutura
          return throwError(() => error);
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return throwError(
        () => new Error('Token não encontrado no cookie ou URL inválida'),
      );
    }
  }

  deleteCamadaRaster(camadaId: string): Observable<any> {
    const url = this.getConfigService.getUrl('delete-camada-raster');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const options = {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      };
      return this.http
        .delete<CamadasRaster>(`${url}/${camadaId}`, options)
        .pipe(
          catchError((error) => {
            console.error('Erro ao deletar a camada raster:', error);
            // Retorna o erro original do backend mantendo toda a estrutura
            return throwError(() => error);
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
