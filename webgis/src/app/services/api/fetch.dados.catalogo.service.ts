import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';
import { GetConfigService } from '../get.config.service';

export type TipoDadoCatalogo = 'vetorial' | 'raster' | 'mapa';

export interface GrupoCatalogo {
  id: string;
  nome: string;
}

export interface TemaCatalogo {
  id: string;
  nome: string;
  grupos: GrupoCatalogo[];
}

export interface ItemCatalogo {
  id: string;
  tipo: TipoDadoCatalogo;
  nomeCamada: string;
  titulo: string;
  descricao: string;
  grupoId: string;
  grupoNome: string;
  temaId: string;
  temaNome: string;
  tags: string | null;
  linkMetadados: string | null;
  boundingBox: string | null;
  atualizado: string;
  acessos: number;
}

export interface DadosCatalogoResponse {
  temas: TemaCatalogo[];
  camadas: ItemCatalogo[];
  camadasRaster: ItemCatalogo[];
  mapas: ItemCatalogo[];
}

const VAZIO: DadosCatalogoResponse = {
  temas: [],
  camadas: [],
  camadasRaster: [],
  mapas: [],
};

@Injectable({ providedIn: 'root' })
export class FetchDadosCatalogoService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  getCatalogo(): Observable<DadosCatalogoResponse> {
    const url = this.getConfigService.getUrl('dados-catalogo');
    return this.http
      .get<DadosCatalogoResponse>(url)
      .pipe(catchError(() => of(VAZIO)));
  }
}
