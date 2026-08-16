import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  Grupos,
  RespostaApi,
  RespostaApiAllGrupos,
} from '../../models/grupo.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchGrupoTemaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getGrupo(idTema?: string): Observable<Grupos[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-grupo');

    let url = baseUrl;
    if (idTema) {
      url = `${url}/${idTema}`;
    }
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .get<RespostaApi | RespostaApiAllGrupos>(url, { headers })
      .pipe(
        map(
          (data) =>
            (data as RespostaApi).gruposTema ??
            (data as RespostaApiAllGrupos).grupos ??
            [],
        ),
        catchError((error) => {
          console.error('Erro ao buscar grupos de camadas:', error);
          return throwError(
            () => new Error('Erro ao buscar grupos de camadas'),
          );
        }),
      );
  }

  getAllGrupos(): Observable<Grupos[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-grupo');

    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApiAllGrupos>(baseUrl, { headers }).pipe(
      map((data) => data.grupos),
      catchError((error) => {
        console.error('Erro ao buscar todos os grupos de camadas:', error);
        return throwError(
          () => new Error('Erro ao buscar todos os grupos de camadas'),
        );
      }),
    );
  }
}
