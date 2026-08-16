import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  CroquiEndereco,
  RespostaApiEnderecos,
} from 'src/app/models/croqui-endereco.model';
import { environment } from 'src/environments/environment';

export interface FiltrosEndereco {
  cd_cidade?: number;
  cd_bairro?: number;
  cd_logradouro?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FetchCroquiEnderecoFiltrosService {
  constructor(private http: HttpClient) {}

  getEnderecosPorFiltros(
    filtros: FiltrosEndereco,
  ): Observable<CroquiEndereco[]> {
    const baseUrl = environment.base_url + '/fetch-croqui-endereco-filtros';

    // Remover parâmetros undefined/null
    const params: any = {};
    if (filtros.cd_cidade) params.cd_cidade = filtros.cd_cidade.toString();
    if (filtros.cd_bairro) params.cd_bairro = filtros.cd_bairro.toString();
    if (filtros.cd_logradouro)
      params.cd_logradouro = filtros.cd_logradouro.toString();

    return this.http.get<RespostaApiEnderecos>(baseUrl, { params }).pipe(
      map((data) => data.enderecos),
      catchError((error) => {
        console.error('Erro ao buscar endereços:', error);
        return throwError(() => new Error('Erro ao buscar endereços'));
      }),
    );
  }

  getEnderecosPorCidade(cd_cidade: number): Observable<CroquiEndereco[]> {
    return this.getEnderecosPorFiltros({ cd_cidade });
  }

  getEnderecosPorCidadeEBairro(
    cd_cidade: number,
    cd_bairro: number,
  ): Observable<CroquiEndereco[]> {
    return this.getEnderecosPorFiltros({ cd_cidade, cd_bairro });
  }

  getEnderecosCompleto(
    cd_cidade: number,
    cd_bairro: number,
    cd_logradouro: number,
  ): Observable<CroquiEndereco[]> {
    return this.getEnderecosPorFiltros({ cd_cidade, cd_bairro, cd_logradouro });
  }

  // Método que retorna também o total
  getEnderecosPorFiltrosComTotal(
    filtros: FiltrosEndereco,
  ): Observable<RespostaApiEnderecos> {
    const baseUrl = environment.base_url + '/fetch-croqui-endereco-filtros';

    const params: any = {};
    if (filtros.cd_cidade) params.cd_cidade = filtros.cd_cidade.toString();
    if (filtros.cd_bairro) params.cd_bairro = filtros.cd_bairro.toString();
    if (filtros.cd_logradouro)
      params.cd_logradouro = filtros.cd_logradouro.toString();

    return this.http.get<RespostaApiEnderecos>(baseUrl, { params }).pipe(
      catchError((error) => {
        console.error('Erro ao buscar endereços:', error);
        return throwError(() => new Error('Erro ao buscar endereços'));
      }),
    );
  }
}
