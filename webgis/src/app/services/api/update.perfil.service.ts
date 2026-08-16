import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Perfil } from '../../models/perfis.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class UpdatePerfilService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  updatePerfil(novoPerfil: any): Observable<any> {
    const baseUrl = this.getConfigService.getUrl('update-perfil');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });
      return this.http.put<Perfil>(baseUrl, novoPerfil, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao atualizar o perfil:', error);
          return throwError(() => new Error('Erro ao atualizar o perfil'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(null);
    }
  }
}
