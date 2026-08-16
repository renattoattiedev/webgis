import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class DeleteGrupoService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  delete(grupoId: string): Observable<any> {
    const url = this.getConfigService.getUrl('delete-grupo');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const options = {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      };
      return this.http.delete(`${url}/${grupoId}`, options).pipe(
        catchError((error) => {
          console.error('Erro ao deletar o grupo de camadas:', error);
          return throwError(
            () => new Error('Erro ao deletar o grupo de camadas'),
          );
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
