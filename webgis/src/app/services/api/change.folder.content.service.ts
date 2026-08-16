import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class ChangeFolderContentService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  changeFolderContent(
    contentType: string,
    idContent: string,
    idFolder: string,
    idFolderOld: string,
  ): Observable<boolean> {
    const url = this.getConfigService.getUrl('change-folder-content');
    const token = this.cookieService.get('access_token');

    if (token && url !== 'undefined') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      });
      const body = {
        contentType: contentType,
        COD_CONTENT_ID: idContent,
        COD_FOLDER_ID: idFolder,
        COD_FOLDER_OLD: idFolderOld,
      };

      return this.http.post(url, body, { headers }).pipe(
        map(() => true),
        catchError((error) => {
          console.error('Erro ao mudar a pasta da camada:', error);
          return of(false);
        }),
      );
    } else {
      console.error('Token não encontrado no cookie ou URL inválida');
      return of(false);
    }
  }
}
