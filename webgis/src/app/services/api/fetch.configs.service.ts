import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  Configs,
  RespostaApi,
  ConfigForEdit,
} from '../../models/configs.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FetchConfigsService {
  constructor(private http: HttpClient) {}

  // Método existente - buscar todas as configs (com mascaramento)
  getConfigs(): Observable<Configs[]> {
    const baseUrl = environment.base_url + '/fetch-configs';

    return this.http.get<RespostaApi>(baseUrl).pipe(
      map((data) => data.configs),
      catchError((error) => {
        console.error('Erro ao buscar configurações:', error);
        return throwError(() => new Error('Erro ao buscar configurações'));
      }),
    );
  }

  // 🆕 Novo método - buscar config real para edição (apenas admins)
  getConfigForEdit(configId: string): Observable<ConfigForEdit> {
    const baseUrl = environment.base_url + `/fetch-configs/edit/${configId}`;

    return this.http.get<ConfigForEdit>(baseUrl).pipe(
      catchError((error) => {
        if (error.status === 403) {
          console.error(
            'Acesso negado: apenas administradores podem editar configurações sensíveis',
          );
          return throwError(
            () =>
              new Error(
                'Acesso negado: apenas administradores podem editar configurações sensíveis',
              ),
          );
        }
        console.error('Erro ao buscar configuração para edição:', error);
        return throwError(
          () => new Error('Erro ao buscar configuração para edição'),
        );
      }),
    );
  }

  // 🆕 Método para atualizar configuração
  updateConfig(configId: string, newValue: string): Observable<any> {
    const baseUrl = environment.base_url + '/update-config';

    return this.http
      .put(baseUrl, {
        id: configId,
        value: newValue,
      })
      .pipe(
        catchError((error) => {
          console.error('Erro ao atualizar configuração:', error);
          return throwError(() => new Error('Erro ao atualizar configuração'));
        }),
      );
  }
}
