import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  RespostaApiSicatImovelHidrometro,
  SicatImovelHidrometroDetalhado,
} from 'src/app/models/sicat-imovel-hidrometro.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FetchSicatImovelByHidrometroService {
  constructor(private http: HttpClient) {}

  getImovelByHidrometro(
    codigoHidrometro: string,
  ): Observable<SicatImovelHidrometroDetalhado> {
    if (!codigoHidrometro || codigoHidrometro.trim() === '') {
      return throwError(() => new Error('Código do hidrômetro é obrigatório'));
    }

    const baseUrl =
      environment.base_url +
      `/fetch-sicat-imovel-by-hidrometro/${encodeURIComponent(codigoHidrometro.trim())}`;

    const timestamp = new Date().getTime();
    const params = { _t: timestamp.toString() };

    return this.http
      .get<RespostaApiSicatImovelHidrometro>(baseUrl, {
        params,
      })
      .pipe(
        map((data) => data.imovelDetalhado),
        catchError((error) => {
          console.error('Erro ao buscar imóvel por hidrômetro:', error);
          let errorMessage = 'Erro ao buscar imóvel pelo código do hidrômetro';

          if (error.status === 404) {
            errorMessage = 'Imóvel não encontrado para este hidrômetro';
          } else if (error.status === 400) {
            errorMessage = 'Código de hidrômetro inválido';
          } else if (error.status === 500) {
            errorMessage = 'Erro interno do servidor';
          }

          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  verificarExistenciaByHidrometro(
    codigoHidrometro: string,
  ): Observable<boolean> {
    return this.getImovelByHidrometro(codigoHidrometro).pipe(
      map(() => true),
      catchError((error) => {
        if (error.message === 'Imóvel não encontrado para este hidrômetro') {
          return [false];
        }
        return throwError(() => error);
      }),
    );
  }

  getRespostaCompletaByHidrometro(
    codigoHidrometro: string,
  ): Observable<RespostaApiSicatImovelHidrometro> {
    if (!codigoHidrometro || codigoHidrometro.trim() === '') {
      return throwError(() => new Error('Código do hidrômetro é obrigatório'));
    }

    const baseUrl =
      environment.base_url +
      `/fetch-sicat-imovel-by-hidrometro/${encodeURIComponent(codigoHidrometro.trim())}`;

    const timestamp = new Date().getTime();
    const params = { _t: timestamp.toString() };

    return this.http
      .get<RespostaApiSicatImovelHidrometro>(baseUrl, {
        params,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      })
      .pipe(
        catchError((error) => {
          console.error(
            'Erro ao buscar resposta completa por hidrômetro:',
            error,
          );
          let errorMessage = 'Erro ao buscar imóvel pelo código do hidrômetro';

          if (error.status === 404) {
            errorMessage = 'Imóvel não encontrado para este hidrômetro';
          } else if (error.status === 400) {
            errorMessage = 'Código de hidrômetro inválido';
          } else if (error.status === 500) {
            errorMessage = 'Erro interno do servidor';
          }

          return throwError(() => new Error(errorMessage));
        }),
      );
  }
}
