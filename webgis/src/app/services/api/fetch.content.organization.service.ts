import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, catchError, map, throwError } from 'rxjs';
import { GetConfigService } from '../get.config.service';
import { Camadas } from '../../models/camadas.model';
import { Mapas } from 'src/app/models/mapas.model';
import { RespostaApi } from 'src/app/models/content.model';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';

@Injectable({
  providedIn: 'root',
})
export class FetchContentOrganizationService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getContentOrganization(): Observable<{
    camadas: Camadas[];
    camadasRaster: CamadasRaster[];
    mapas: Mapas[];
  }> {
    const baseUrl = this.getConfigService.getUrl('fetch-content-organization');

    const token = this.cookieService.get('access_token');
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
        console.error('Erro ao buscar conteúdo:', error);
        return throwError(() => new Error('Erro ao buscar conteúdo'));
      }),
    );
  }
}
