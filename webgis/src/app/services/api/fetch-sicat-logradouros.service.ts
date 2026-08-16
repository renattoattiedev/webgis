import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  RespostaApiLogradouros,
  SicatLogradouro,
} from 'src/app/models/sicat-logradouro.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FetchSicatLogradourosService {
  constructor(private http: HttpClient) {}

  /**
   * Busca bairros filtrando por um ou mais códigos de cidade (cd_cidade).
   * @param codigoCidade Um número ou array de números obrigatórios (códigos das cidades)
   */
  getLogradouros(
    codigoCidade: number | number[],
  ): Observable<SicatLogradouro[]> {
    const baseUrl = environment.base_url + '/fetch-sicat-logradouros';
    const params: { [param: string]: any } = {};
    if (Array.isArray(codigoCidade)) {
      // Corrige para enviar como string separada por vírgula
      params['codigoCidade'] = codigoCidade.join(',');
    } else {
      params['codigoCidade'] = codigoCidade;
    }

    return this.http.get<RespostaApiLogradouros>(baseUrl, { params }).pipe(
      map((data) => data.logradouros),
      catchError((error) => {
        console.error('Erro ao buscar Logradouros:', error);
        return throwError(() => new Error('Erro ao buscar Logradouros'));
      }),
    );
  }
}
