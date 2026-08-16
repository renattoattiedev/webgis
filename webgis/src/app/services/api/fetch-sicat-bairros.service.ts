import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  RespostaApiBairros,
  SicatBairro,
} from 'src/app/models/sicat-bairro.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FetchSicatBairrosService {
  constructor(private http: HttpClient) {}

  /**
   * Busca bairros filtrando por um ou mais códigos de cidade (cd_cidade).
   * @param codigoCidade Um número ou array de números obrigatórios (códigos das cidades)
   */
  getBairros(codigoCidade: number | number[]): Observable<SicatBairro[]> {
    const baseUrl = environment.base_url + '/fetch-sicat-bairros';
    const params: { [param: string]: any } = {};
    if (Array.isArray(codigoCidade)) {
      // Corrige para enviar como string separada por vírgula
      params['codigoCidade'] = codigoCidade.join(',');
    } else {
      params['codigoCidade'] = codigoCidade;
    }
    return this.http.get<RespostaApiBairros>(baseUrl, { params }).pipe(
      map((data) => data.bairros),
      catchError((error) => {
        console.error('Erro ao buscar bairros:', error);
        return throwError(() => new Error('Erro ao buscar bairros'));
      }),
    );
  }
}
