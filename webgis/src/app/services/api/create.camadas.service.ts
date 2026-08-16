import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Camadas } from '../../models/camadas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class CreateCamadasService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  createCamada(camada: Camadas): Observable<Camadas> {
    const url = this.getConfigService.getUrl('create-camadas');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      return this.http.post<Camadas>(url, camada, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao criar a camada:', error);
          return throwError(() => new Error('Erro ao criar a camada'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return throwError(
        () => new Error('Token não encontrado no cookie ou URL inválida'),
      );
    }
  }

  uploadEstilo(
    estilo: File,
    codPacoteConceitualId: string,
    nomeCamada: string,
  ): Observable<any> {
    const url = this.getConfigService.getUrl('upload-estilo-camada');

    if (url !== 'undefined') {
      const formData = new FormData();
      formData.append('file', estilo);
      return this.http
        .post(`${url}/${codPacoteConceitualId}/${nomeCamada}`, formData)
        .pipe(
          catchError((error) => {
            console.error('Erro ao fazer upload do estilo:', error);
            return of(null);
          }),
        );
    } else {
      console.error('URL inválida');
      return of(null);
    }
  }

  createCamadaRaster(payload: {
    relativePath: string;
    overwrite?: boolean;
    tituloCamada: string;
    descricaoCamada: string;
    nivelCompartilhamentoId: string;
    grupoCamada: string;
    linkMetadados?: string;
    termosDeUso?: string;
    tags?: string;
    carregamentoDefault?: boolean;
  }): Observable<{ camadaId: string; status: string }> {
    const url = this.getConfigService.getUrl('create-camadas-raster');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http
      .post<{ camadaId: string; status: string }>(url, payload, { headers })
      .pipe(
        catchError((error) => {
          console.error('Erro ao criar a camada:', error);
          return throwError(() => new Error('Erro ao criar a camada raster'));
        }),
      );
  }

  republicarCamada(
    camadaId: string,
    payload: {
      tituloCamada: string;
      descricaoCamada: string;
      linkMetadados?: string;
      termosDeUso?: string;
      nivelCompartilhamentoId: string;
      grupoCamada: string;
      tags?: string;
      fonteDadosCamada?: string;
      carregamentoDefault?: boolean;
    },
  ): Observable<{ status: string }> {
    const url = `${this.getConfigService.getUrl('camadas')}/${camadaId}/republicar`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.post<{ status: string }>(url, payload, { headers });
  }

  republicarCamadaRaster(
    camadaId: string,
    payload: {
      tituloCamada: string;
      descricaoCamada: string;
      linkMetadados?: string;
      termosDeUso?: string;
      nivelCompartilhamentoId: string;
      grupoCamada: string;
      tags?: string;
      carregamentoDefault?: boolean;
    },
  ): Observable<{ camadaId: string; status: string }> {
    const url = `${this.getConfigService.getUrl('camadas-raster')}/${camadaId}/republicar`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http.post<{ camadaId: string; status: string }>(url, payload, {
      headers,
    });
  }
}
