import { CamadasRaster } from './../../models/camadas.raster.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { GetConfigService } from '../get.config.service';
import { Camadas } from '../../models/camadas.model';
import { Mapas } from '../../models/mapas.model';
import { RespostaApi } from '../../models/content.model';

@Injectable({
  providedIn: 'root',
})
export class FetchContentUsuarioService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getContent(idGrupo: string): Observable<{
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }> {
    const baseUrl = this.getConfigService.getUrl('fetch-content-usuario');
    const url = `${baseUrl}/${idGrupo}`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(url, { headers }).pipe(
      map((data) => ({
        camadas: data.camadas,
        camadasRaster: data.camadasRaster,
        mapas: data.mapas,
      })),
      catchError((error) => {
        console.error('Erro ao buscar conteúdo:', error);
        return throwError(() => new Error('Erro ao buscar conteúdo'));
      }),
    );
  }

  getAllContent(): Observable<{
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }> {
    const baseUrl = this.getConfigService.getUrl('fetch-content-usuario');
    const token = this.cookieService.get('access_token');

    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      return this.http.get<RespostaApi>(baseUrl, { headers }).pipe(
        map((data) => ({
          camadas: data.camadas,
          camadasRaster: data.camadasRaster,
          mapas: data.mapas,
        })),
        catchError((error) => {
          console.error('Erro ao buscar todo o conteúdo:', error);
          return throwError(() => new Error('Erro ao buscar todo o conteúdo'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of({ camadas: [], camadasRaster: [], mapas: [] });
    }
  }
}
