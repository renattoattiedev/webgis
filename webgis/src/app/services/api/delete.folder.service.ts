import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Folder } from '../../models/folders.camadas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class DeleteFolderService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  deleteFolder(folderId: string): Observable<any> {
    const url = this.getConfigService.getUrl('delete-folder');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const options = {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      };
      return this.http.delete<Folder>(`${url}/${folderId}`, options).pipe(
        catchError((error) => {
          console.error('Erro ao deletar a pasta:', error);
          return throwError(() => new Error('Erro ao deletar a pasta'));
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return throwError(
        () => new Error('Token não encontrado no cookie ou URL inválida'),
      );
    }
  }
}
