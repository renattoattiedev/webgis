import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { GetConfigService } from '../get.config.service';

export interface Indicadores {
  temas: number;
  grupos: number;
  camadasVetoriais: number;
  camadasRaster: number;
  mapas: number;
  usuarios: number;
}

@Injectable({ providedIn: 'root' })
export class FetchIndicadoresService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  getIndicadores(): Observable<Indicadores> {
    const url = this.getConfigService.getUrl('indicadores');
    return this.http.get<Indicadores>(url).pipe(
      catchError(() =>
        of({
          temas: 0,
          grupos: 0,
          camadasVetoriais: 0,
          camadasRaster: 0,
          mapas: 0,
          usuarios: 0,
        }),
      ),
    );
  }
}
