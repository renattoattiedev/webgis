import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';
import { MapaResponse, Mapas } from '../../models/mapas.model';

@Injectable({
  providedIn: 'root',
})
export class SaveMapasService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  saveMapa(mapas: Mapas): Observable<MapaResponse> {
    const url = this.getConfigService.getUrl('save-mapas');
    const token = this.cookieService.get('access_token');

    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });

      let boundingBoxMapa;

      if (typeof mapas.boundingBoxMapa === 'string') {
        try {
          boundingBoxMapa = JSON.parse(mapas.boundingBoxMapa);

          if (
            typeof boundingBoxMapa.minx !== 'number' ||
            typeof boundingBoxMapa.miny !== 'number' ||
            typeof boundingBoxMapa.maxx !== 'number' ||
            typeof boundingBoxMapa.maxy !== 'number' ||
            !boundingBoxMapa.crs
          ) {
            console.error(
              'boundingBoxMapa com campos inválidos',
              boundingBoxMapa,
            );
            return throwError(
              () => new Error('boundingBoxMapa com campos inválidos'),
            );
          }
        } catch (error) {
          console.error('Erro ao parsear boundingBoxMapa:', error);
          return throwError(() => new Error('Erro ao parsear boundingBoxMapa'));
        }
      } else if (typeof mapas.boundingBoxMapa === 'object') {
        boundingBoxMapa = mapas.boundingBoxMapa;
      } else {
        console.error('boundingBoxMapa não é um objeto ou string JSON válida');
        return throwError(
          () =>
            new Error('boundingBoxMapa não é um objeto ou string JSON válida'),
        );
      }

      const body = {
        ...mapas,
        boundingBoxMapa,
      };

      return this.http.post<MapaResponse>(url, body, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao criar o mapa:', error);
          const mensagemBackend = error?.error?.message;
          return throwError(
            () => new Error(mensagemBackend || 'Erro ao criar o mapa'),
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
