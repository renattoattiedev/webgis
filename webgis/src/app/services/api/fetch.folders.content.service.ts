import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, map, throwError } from 'rxjs';
import { RespostaApi } from '../../models/content.model';
import { GetConfigService } from '../get.config.service';
import { Mapas } from '../../models/mapas.model';
import { Camadas } from '../../models/camadas.model';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';

@Injectable({
  providedIn: 'root',
})
export class FetchFoldersContentService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getFoldersContent(idFolder: string): Observable<{
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }> {
    const baseUrl = this.getConfigService.getUrl('fetch-folders-content');
    const url = `${baseUrl}/${idFolder}`;
    const token = this.cookieService.get('access_token');

    if (token && baseUrl !== 'undefined') {
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
          console.error('Erro ao buscar camadas e mapas de pastas:', error);
          return throwError(
            () => new Error('Erro ao buscar camadas e mapas de pastas'),
          );
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of({ camadas: [], camadasRaster: [], mapas: [] });
    }
  }
}
