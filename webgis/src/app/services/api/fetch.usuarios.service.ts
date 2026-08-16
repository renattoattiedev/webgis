import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, map, catchError, throwError } from 'rxjs';
import { RespostaApi, User } from '../../models/users.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchUsuariosService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getUsers(): Observable<User[]> {
    const baseUrl = this.getConfigService.getUrl('fetch-usuarios');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<RespostaApi>(baseUrl, { headers }).pipe(
      map((data) => data.users),
      catchError((error) => {
        console.error('Erro ao buscar usuários:', error);
        return throwError(() => new Error('Erro ao buscar usuários'));
      }),
    );
  }
}
