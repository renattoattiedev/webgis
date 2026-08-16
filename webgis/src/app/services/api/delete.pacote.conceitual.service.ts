import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class DeletePacoteConceitualService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  delete(pacoteConceitualId: string): Observable<any> {
    console.log(
      `🗑️ Service: Iniciando exclusão do pacote ${pacoteConceitualId}`,
    );

    const url = this.getConfigService.getUrl('delete-pacote-conceitual');

    const token = this.cookieService.get('access_token');

    if (!token) {
      console.error('❌ Token não encontrado no cookie');
      return throwError(() => ({
        status: 401,
        error: {
          message: 'Token de autenticação não encontrado',
          error: 'Unauthorized',
          statusCode: 401,
        },
      }));
    }

    if (!url || url === 'undefined') {
      console.error('❌ URL inválida para delete-pacote-conceitual');
      return throwError(() => ({
        status: 500,
        error: {
          message: 'URL do serviço não configurada',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      }));
    }

    const fullUrl = `${url}/${pacoteConceitualId}`;
    console.log(`🌐 URL da requisição: ${fullUrl}`);

    const options = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }),
    };

    return this.http.delete(fullUrl, options).pipe(
      catchError((error) => {
        console.error('❌ Erro HTTP ao deletar pacote conceitual:', error);

        // 🔧 Preservar a estrutura original do erro do backend
        return throwError(() => {
          // Se o erro já tem a estrutura esperada do backend, manter
          if (error.error && typeof error.error === 'object') {
            return {
              status: error.status || 500,
              error: error.error,
            };
          }

          // 🔧 Tratar diferentes tipos de erro HTTP
          switch (error.status) {
            case 409:
              // Conflito - camadas publicadas (estrutura do backend já está correta)
              console.warn('🚫 Conflito: Camadas publicadas detectadas');
              return {
                status: 409,
                error: error.error || {
                  success: false,
                  message: 'Pacote possui camadas publicadas no GeoServer',
                  error: 'Conflict',
                  statusCode: 409,
                  details: {
                    action: 'DELETE_BLOCKED',
                    reason: 'PUBLISHED_LAYERS_EXIST',
                    userFriendlyMessage:
                      'O pacote conceitual possui camadas publicadas no GeoServer.',
                    solution:
                      'Despublique todas as camadas antes de excluir o pacote conceitual.',
                  },
                },
              };

            case 403:
              // Acesso negado
              console.warn('🚫 Acesso negado');
              return {
                status: 403,
                error: {
                  success: false,
                  message:
                    'Apenas administradores podem excluir pacotes conceituais',
                  error: 'Forbidden',
                  statusCode: 403,
                  details: {
                    action: 'ACCESS_DENIED',
                    reason: 'INSUFFICIENT_PERMISSIONS',
                  },
                },
              };

            case 404:
              // Não encontrado
              console.warn('🔍 Pacote não encontrado');
              return {
                status: 404,
                error: {
                  success: false,
                  message: 'Pacote conceitual não encontrado',
                  error: 'Not Found',
                  statusCode: 404,
                  details: {
                    action: 'DELETE_ERROR',
                    reason: 'PACKAGE_NOT_FOUND',
                  },
                },
              };

            case 400:
              // Requisição inválida
              console.warn('⚠️ Requisição inválida');
              return {
                status: 400,
                error: {
                  success: false,
                  message: error.error?.message || 'Dados inválidos fornecidos',
                  error: 'Bad Request',
                  statusCode: 400,
                  details: {
                    action: 'DELETE_ERROR',
                    reason: 'INVALID_REQUEST',
                  },
                },
              };

            case 401:
              // Não autorizado
              console.warn('🔐 Token inválido ou expirado');
              return {
                status: 401,
                error: {
                  success: false,
                  message: 'Token de autenticação inválido ou expirado',
                  error: 'Unauthorized',
                  statusCode: 401,
                  details: {
                    action: 'DELETE_ERROR',
                    reason: 'INVALID_TOKEN',
                  },
                },
              };

            case 500:
              // Erro interno do servidor
              console.error('💥 Erro interno do servidor');
              return {
                status: 500,
                error: {
                  success: false,
                  message: 'Erro interno do servidor',
                  error: 'Internal Server Error',
                  statusCode: 500,
                  details: {
                    action: 'DELETE_ERROR',
                    reason: 'SERVER_ERROR',
                  },
                },
              };

            case 0:
              // Erro de rede/conectividade
              console.error('🌐 Erro de conectividade');
              return {
                status: 0,
                error: {
                  success: false,
                  message:
                    'Erro de conectividade. Verifique sua conexão com a internet.',
                  error: 'Network Error',
                  statusCode: 0,
                  details: {
                    action: 'DELETE_ERROR',
                    reason: 'NETWORK_ERROR',
                  },
                },
              };

            default:
              // Outros erros
              console.error(`❓ Erro HTTP não tratado: ${error.status}`);
              return {
                status: error.status || 500,
                error: {
                  success: false,
                  message:
                    error.error?.message ||
                    `Erro HTTP ${error.status}: ${error.statusText}`,
                  error: error.statusText || 'Unknown Error',
                  statusCode: error.status || 500,
                  details: {
                    action: 'DELETE_ERROR',
                    reason: 'UNKNOWN_ERROR',
                  },
                },
              };
          }
        });
      }),
    );
  }

  // 🆕 Método para verificar se um pacote pode ser excluído (futuro)
  canDelete(pacoteConceitualId: string): Observable<any> {
    console.log(
      `🔍 Verificando se pacote ${pacoteConceitualId} pode ser excluído...`,
    );

    const url = this.getConfigService.getUrl('check-pacote-conceitual-delete');
    const token = this.cookieService.get('access_token');

    if (!token || !url || url === 'undefined') {
      return throwError(() => ({
        status: 400,
        error: {
          message: 'Token ou URL não configurados',
          canDelete: false,
        },
      }));
    }

    const options = {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }),
    };

    return this.http.get(`${url}/${pacoteConceitualId}`, options).pipe(
      catchError((error) => {
        console.warn('⚠️ Erro ao verificar possibilidade de exclusão:', error);
        return throwError(() => ({
          status: error.status || 500,
          error: {
            message: 'Erro ao verificar possibilidade de exclusão',
            canDelete: false,
          },
        }));
      }),
    );
  }
}
