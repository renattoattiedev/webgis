import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import {
  RespostaApiCidades,
  SicatCidade,
} from 'src/app/models/sicat-cidades.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FetchSicatCidadesService {
  constructor(private http: HttpClient) {}

  getCidades(): Observable<SicatCidade[]> {
    const baseUrl = environment.base_url + '/fetch-sicat-cidades';
    return this.http.get<RespostaApiCidades>(baseUrl).pipe(
      map((data) => data.cidades),
      catchError((error) => {
        console.error('Erro ao buscar cidades:', error);
        return throwError(() => new Error('Erro ao buscar cidades'));
      }),
    );
  }
}
