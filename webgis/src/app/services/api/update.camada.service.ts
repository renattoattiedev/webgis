import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Camadas } from '../../models/camadas.model';
import { GetConfigService } from '../get.config.service';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateCamadaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updateCamada(camadas: Camadas): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-camada');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      if (typeof camadas.boundingBox === 'string') {
        try {
          camadas.boundingBox = JSON.parse(camadas.boundingBox);
        } catch (error) {
          console.error('Erro ao converter boundingBox para objeto:', error);
          return throwError(() => new Error('Formato de boundingBox inválido'));
        }
      }

      return this.http.put<Camadas>(baseUrl, camadas, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao atualizar a camada:', error);
          const mensagemBackend = error?.error?.message;
          return throwError(
            () => new Error(mensagemBackend || 'Erro ao atualizar a camada'),
          );
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }

  updateCamadaRaster(camadasRaster: CamadasRaster): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-camada-raster');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      if (typeof camadasRaster.boundingBox === 'string') {
        try {
          camadasRaster.boundingBox = JSON.parse(camadasRaster.boundingBox);
        } catch (error) {
          console.error('Erro ao converter boundingBox para objeto:', error);
          return throwError(() => new Error('Formato de boundingBox inválido'));
        }
      }

      return this.http.put<Camadas>(baseUrl, camadasRaster, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao atualizar a camada raster:', error);
          const mensagemBackend = error?.error?.message;
          return throwError(
            () =>
              new Error(mensagemBackend || 'Erro ao atualizar a camada raster'),
          );
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }
}
