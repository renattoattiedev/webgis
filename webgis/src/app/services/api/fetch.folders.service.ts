import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of, catchError, throwError } from 'rxjs';
import { Folder } from '../../models/folders.camadas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class FetchFoldersService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  getFolders(): Observable<{ folders: Folder[] }> {
    const baseUrl = this.getConfigService.getUrl('fetch-folders');

    const token = this.cookieService.get('access_token');
    if (token && baseUrl !== 'undefined') {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
      });

      return this.http.get<{ folders: Folder[] }>(baseUrl, { headers }).pipe(
        catchError((error) => {
          console.error('Erro ao buscar pastas:', error);
          return throwError(() => new Error('Erro ao buscar pastas'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of({ folders: [] });
    }
  }
}
