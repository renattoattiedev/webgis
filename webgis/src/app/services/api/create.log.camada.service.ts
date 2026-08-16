import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreateLogCamadaService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  createLogCamada(camadasLogData: {
    id: string;
    captchaToken: string;
  }): Observable<any> {
    const url = this.getConfigService.getUrl('create-log-camada');

    if (url !== 'undefined') {
      return this.http.post(url, camadasLogData).pipe(
        catchError((error) => {
          console.error('Erro ao criar o log da camada:', error);
          return of(null);
        }),
      );
    } else {
      console.error('URL inválida');
      return of(null);
    }
  }

  createLogCamadaRaster(camadasLogData: {
    id: string;
    captchaToken: string;
  }): Observable<any> {
    const url = this.getConfigService.getUrl('create-log-camada-raster');

    if (url !== 'undefined') {
      return this.http.post(url, camadasLogData).pipe(
        catchError((error) => {
          console.error('Erro ao criar o log da camada:', error);
          return of(null);
        }),
      );
    } else {
      console.error('URL inválida');
      return of(null);
    }
  }
}
