import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, throwError } from 'rxjs';
import { GetConfigService } from '../get.config.service';
import { CamadaPublicavel } from 'src/app/models/camada-publicavel.model';

@Injectable({
  providedIn: 'root',
})
export class FetchCamadasPublicaveisService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getCamadasPublicaveis(
    idPacoteConceitual: string,
  ): Observable<CamadaPublicavel[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-camadas-publicaveis');
    const url = `${baseUrl}/${idPacoteConceitual}`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<{ layers: CamadaPublicavel[] }>(url, { headers }).pipe(
      map((response) => response.layers),
      catchError((error) => {
        console.error('Erro ao buscar camadas publicáveis:', error);
        return throwError(
          () => new Error('Erro ao buscar camadas publicáveis'),
        );
      }),
    );
  }
}
