import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, catchError, throwError } from 'rxjs';
import { SsSequenciasResponse } from '../../models/ss-sequencias.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchSolicitacaoServicosSequenciasService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  /**
   * Busca as sequências de SS pelo número da SS
   * @param numSs Número da SS
   * @returns Observable com as sequências encontradas
   */
  getSequenciasByNumSs(numSs: string): Observable<SsSequenciasResponse> {
    if (!numSs || numSs.trim() === '') {
      return throwError(() => new Error('Número da SS é obrigatório'));
    }

    const baseUrl =
      this.getConfigService.getUrl('fetch-solicitacao-servicos-by-numss') +
      `/${encodeURIComponent(numSs.trim())}`;
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<SsSequenciasResponse>(baseUrl, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao buscar sequências da SS:', error);
        let errorMessage = 'Erro ao buscar sequências da SS';

        if (error.status === 404) {
          errorMessage = 'Nenhuma sequência encontrada para esta SS';
        } else if (error.status === 400) {
          errorMessage = 'Número da SS inválido';
        } else if (error.status === 500) {
          errorMessage = 'Erro interno do servidor';
        }

        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
