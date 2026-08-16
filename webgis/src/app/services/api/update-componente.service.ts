import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';
import { CookieService } from 'ngx-cookie-service';
import { Componente } from 'src/app/models/componente.model';

@Injectable({
  providedIn: 'root',
})
export class UpdateComponenteService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
    private cookieService: CookieService,
  ) {}

  updateComponente(componente: Componente): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-componente');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // O backend espera os campos: id, nome, descricao, configuracao, habilitado
    const body = {
      id: componente.id,
      nome: componente.nome,
      descricao: componente.descricao,
      configuracao: componente.configuracao,
      habilitado: componente.habilitado,
    };

    return this.http.put(baseUrl, body, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao atualizar componente:', error);
        return throwError(() => new Error('Erro ao atualizar componente'));
      }),
    );
  }
}
