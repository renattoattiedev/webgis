import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  RespostaApiSolicitacaoServicosDetalhada,
  SolicitacaoServicosDetalhadaPresenter,
  SolicitacaoServicosDetalhadaResponse,
} from 'src/app/models/solicitacao-servicos-detalhada.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FetchSolicitacaoServicosDetalhadaService {
  constructor(private http: HttpClient) {}

  getSolicitacaoServicos(
    numSs: string,
    seqSs: string,
  ): Observable<SolicitacaoServicosDetalhadaResponse> {
    if (!numSs || numSs.trim() === '') {
      return throwError(() => new Error('Número da SS é obrigatório'));
    }

    const baseUrl =
      environment.base_url + `/fetch-solicitacao-servicos-detalhada`;

    const body = {
      numSs: numSs.trim(),
      seqSs: seqSs.trim(),
    };

    return this.http
      .post<RespostaApiSolicitacaoServicosDetalhada>(baseUrl, body)
      .pipe(
        map((data) => {
          // Suporta o formato novo do backend: { solicitacoes: [...], success: true, message: "..." }
          if (
            data.solicitacoes &&
            Array.isArray(data.solicitacoes) &&
            data.solicitacoes.length > 0
          ) {
            return SolicitacaoServicosDetalhadaPresenter.toHTTP(
              data.solicitacoes[0],
            );
          }

          // Suporta o formato antigo: { solicitacao: {...} }
          if (data.solicitacao) {
            return SolicitacaoServicosDetalhadaPresenter.toHTTP(
              data.solicitacao,
            );
          }

          throw new Error('Solicitação de serviços não encontrada');
        }),
        catchError((error) => {
          let errorMessage = 'Erro ao buscar dados da solicitação de serviços';

          if (error.status === 404) {
            errorMessage = 'Solicitação de serviços não encontrada';
          } else if (error.status === 400) {
            errorMessage = 'Número da SS inválido';
          } else if (error.status === 500) {
            errorMessage = 'Erro interno do servidor';
          } else if (
            error.message &&
            error.message.includes('não encontrada')
          ) {
            errorMessage = 'Solicitação de serviços não encontrada';
          }

          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  verificarExistencia(numSs: string, seqSs: string): Observable<boolean> {
    return this.getSolicitacaoServicos(numSs, seqSs).pipe(
      map(() => true),
      catchError((error) => {
        if (error.message === 'Solicitação de serviços não encontrada') {
          return [false];
        }
        return throwError(() => error);
      }),
    );
  }
}
