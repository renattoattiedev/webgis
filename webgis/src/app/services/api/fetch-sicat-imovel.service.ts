import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  RespostaApiSicatImovel,
  ImovelDetalhado,
} from 'src/app/models/sicat-imovel.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FetchSicatImovelService {
  constructor(private http: HttpClient) {}

  getImovel(matriculaImovel: string): Observable<ImovelDetalhado> {
    if (!matriculaImovel || matriculaImovel.trim() === '') {
      return throwError(() => new Error('Matrícula do imóvel é obrigatória'));
    }

    const baseUrl =
      environment.base_url +
      `/fetch-sicat-imovel/${encodeURIComponent(matriculaImovel.trim())}`;

    const timestamp = new Date().getTime();
    const params = { _t: timestamp.toString() };

    return this.http
      .get<RespostaApiSicatImovel>(baseUrl, {
        params,
      })
      .pipe(
        map((data) => {
          // Aceita tanto "imovel" quanto "imovelDetalhado" como campo de payload
          const imovel = data?.imovel ?? data?.imovelDetalhado;
          if (!imovel) {
            throw new Error('Payload inválido: imovel não encontrado');
          }
          return imovel as ImovelDetalhado;
        }),
        catchError((error) => {
          console.error('Erro ao buscar dados do imóvel:', error);
          let errorMessage = 'Erro ao buscar dados do imóvel';

          if (error.status === 404) {
            errorMessage = 'Imóvel não encontrado';
          } else if (error.status === 400) {
            errorMessage = 'Matrícula inválida';
          } else if (error.status === 500) {
            errorMessage = 'Erro interno do servidor';
          }

          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  verificarExistencia(matriculaImovel: string): Observable<boolean> {
    return this.getImovel(matriculaImovel).pipe(
      map(() => true),
      catchError((error) => {
        if (error.message === 'Imóvel não encontrado') {
          return [false];
        }
        return throwError(() => error);
      }),
    );
  }
}
