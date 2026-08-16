import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { GetConfigService } from '../get.config.service';
import { User } from 'src/app/models/users.model';

@Injectable({
  providedIn: 'root',
})
export class GetUserPerfilService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getCurrentUser(): Observable<User> {
    const baseUrl = this.getConfigService.getUrl('get-user-perfil');
    const token = this.cookieService.get('access_token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<User>(`${baseUrl}`, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao buscar o usuario:', error);
        return throwError(() => new Error('Erro ao buscar o usuario'));
      }),
    );
  }
}
