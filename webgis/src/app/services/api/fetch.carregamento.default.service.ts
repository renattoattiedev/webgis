import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import {
  CarregamentoDefaultResponse,
  CarregamentoDefaultItem,
} from 'src/app/models/carregamento-default.model';

@Injectable({
  providedIn: 'root',
})
export class FetchCarregamentoDefaultService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  /**
   * Busca lista de conteúdos com flag de carregamento padrão.
   * Endpoint: fetch-carregamento-padrao
   * Funciona com ou sem autenticação (camadas padrão são públicas)
   */
  getCarregamentoPadrao(): Observable<{
    conteudo: CarregamentoDefaultItem[];
    total: number;
  }> {
    const baseUrl = this.getConfigService.getUrl('fetch-carregamento-padrao');

    if (baseUrl === 'undefined') {
      console.error('URL inválida para fetch-carregamento-padrao');
      return of({ conteudo: [], total: 0 });
    }

    // Tenta usar token se disponível, mas não é obrigatório
    const token = this.cookieService.get('access_token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();

    return this.http
      .get<CarregamentoDefaultResponse>(baseUrl, { headers })
      .pipe(
        map((resp) => ({ conteudo: resp.conteudo, total: resp.total })),
        catchError((error) => {
          console.error('Erro ao buscar carregamento padrão:', error);
          return throwError(
            () => new Error('Erro ao buscar carregamento padrão'),
          );
        }),
      );
  }
}
