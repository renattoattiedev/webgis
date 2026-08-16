import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Mapas } from '../../models/mapas.model';
import { GetConfigService } from '../get.config.service';

@Injectable({
  providedIn: 'root',
})
export class DeleteMapaService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  deleteMapa(mapaId: string): Observable<any> {
    const url = this.getConfigService.getUrl('delete-mapa');

    const token = this.cookieService.get('access_token');
    if (token && url !== 'undefined') {
      const options = {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token}`,
        }),
      };
      return this.http.delete<Mapas>(`${url}/${mapaId}`, options).pipe(
        catchError((error) => {
          console.error('Erro ao deletar a mapa:', error);
          return throwError(() => new Error('Erro ao deletar a mapa'));
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
