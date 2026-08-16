import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import {
  RespostaApi,
  PacotesConceituais,
  ConnectionData,
  PacoteConnectionResponse,
  PacoteForEdit,
} from '../../models/pacotes-conceituais.model';
import { GetConfigService } from '../get.config.service';
import { AuthenticateService } from './authenticate.service';

@Injectable({
  providedIn: 'root',
})
export class FetchPacotesConceituaisService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
    private authService: AuthenticateService,
  ) {}

  getAllPacotes(): Observable<PacotesConceituais[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-pacotes-conceituais');

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(baseUrl, { headers }).pipe(
      map((data) => data.pacotesConceituais),
      catchError((error) => {
        console.error('Erro ao buscar pacotes conceituais:', error);
        return throwError(
          () => new Error('Erro ao buscar pacotes conceituais'),
        );
      }),
    );
  }

  getConnectionData(pacoteId: string): Observable<PacoteConnectionResponse> {
    const baseUrl = this.getConfigService.getUrl(
      `fetch-pacotes-conceituais/connection-data/${pacoteId}`,
    );

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<PacoteConnectionResponse>(baseUrl, { headers }).pipe(
      catchError((error) => {
        if (error.status === 403) {
          console.error(
            'Acesso negado: apenas administradores podem acessar dados de conexão',
          );
          return throwError(
            () =>
              new Error(
                'Acesso negado: apenas administradores podem acessar dados de conexão',
              ),
          );
        }
        console.error('Erro ao buscar dados de conexão:', error);
        return throwError(() => new Error('Erro ao buscar dados de conexão'));
      }),
    );
  }

  getPacoteForEdit(pacoteId: string): Observable<PacoteForEdit> {
    const baseUrl = this.getConfigService.getUrl(
      `fetch-pacotes-conceituais/edit/${pacoteId}`,
    );

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<PacoteForEdit>(baseUrl, { headers }).pipe(
      catchError((error) => {
        if (error.status === 403) {
          console.error(
            'Acesso negado: apenas administradores podem editar pacotes conceituais',
          );
          return throwError(
            () =>
              new Error(
                'Acesso negado: apenas administradores podem editar pacotes conceituais',
              ),
          );
        }
        console.error('Erro ao buscar pacote para edição:', error);
        return throwError(() => new Error('Erro ao buscar pacote para edição'));
      }),
    );
  }

  async executeWithConnectionData(
    pacoteId: string,
    operation: (connectionData: ConnectionData) => Promise<any>,
  ): Promise<any> {
    try {
      const response = await this.getConnectionData(pacoteId).toPromise();

      if (!response?.connectionData) {
        throw new Error('Dados de conexão não disponíveis');
      }

      console.log(
        `🔒 Usando dados de conexão do pacote ${response.nome} para operação do sistema em ${new Date()}`,
      );

      const result = await operation(response.connectionData);

      return result;
    } catch (error: any) {
      console.error('Erro ao executar operação com dados de conexão:', error);
      throw error;
    }
  }

  isUserAdmin(): Observable<boolean> {
    // 1) Confirmação rápida via autenticação local (cookie/perfil)
    if (this.authService.isAdmin()) {
      return of(true);
    }

    // 2) Fallback: permissões efetivas pelo backend (editar pelo menos um pacote)
    return this.getAllPacotes().pipe(
      map((pacotes) => (pacotes || []).some((p) => p.canEdit === true)),
      catchError((err) => {
        console.error(
          'isUserAdmin(): erro ao verificar via getAllPacotes()',
          err,
        );
        return of(false);
      }),
    );
  }

  getEditablePacotes(): Observable<PacotesConceituais[]> {
    return this.getAllPacotes().pipe(
      map((pacotes) => pacotes.filter((p) => p.canEdit)),
    );
  }

  getPacotesForDisplay(): Observable<PacotesConceituais[]> {
    return this.getAllPacotes().pipe(
      map((pacotes) =>
        pacotes.map((pacote) => ({
          ...pacote,
          displayHost: pacote.accessDenied ? '[ACESSO NEGADO]' : pacote.host,
          displayDatabase: pacote.accessDenied
            ? '[ACESSO NEGADO]'
            : pacote.database,
          displayUser: pacote.accessDenied ? '[ACESSO NEGADO]' : pacote.user,
          displayPassword: pacote.accessDenied
            ? '[ACESSO NEGADO]'
            : pacote.password,
        })),
      ),
    );
  }
}
