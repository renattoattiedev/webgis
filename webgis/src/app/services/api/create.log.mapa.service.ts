import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreateLogMapaService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  createLogMapa(mapasLogData: {
    id: string;
    captchaToken: string;
  }): Observable<any> {
    const url = this.getConfigService.getUrl('create-log-mapa');

    if (url !== 'undefined') {
      return this.http.post(url, mapasLogData).pipe(
        catchError((error) => {
          console.error('Erro ao criar o log da mapa:', error);
          return of(null);
        }),
      );
    } else {
      console.error('URL inválida');
      return of(null);
    }
  }
}
