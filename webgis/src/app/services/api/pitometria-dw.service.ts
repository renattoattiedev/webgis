import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';

export interface MedicaoDw {
  codPontoMedicao: string;
  nomePontoMedicao: string | null;
  localPontoMedicao: string | null;
  tipoPontoMedicao: string | null;
  situacaoVazao: string | null;
  tipoMedicao: string | null;
  tipoRegistro: string | null;
  codMedidorPressao: string | null;
  cotaMedidor: number | null;
  instalacaoMedidor: string | null;
  diametroRede: number | null;
  diametroMedidor: number | null;
  matricula: string | null;
  dataRegistro: string | null;
  ano: number | null;
  mes: number | null;
  dia: number | null;
  hora: number | null;
  minuto: number | null;
  pressaoMaxima: number | null;
  pressaoMedia: number | null;
  pressaoMinima: number | null;
  amplitude: number | null;
  piezometrica: number | null;
  desvioPadrao: number | null;
  qtdeRegistros: number | null;
  numeroOs: string | null;
  houveOcorrencia: boolean | null;
  observacao: string | null;
  longitude: number | null;
  latitude: number | null;
}

export interface FetchPitometriaDwFiltros {
  codSimp?: string;
  matricula?: string;
  numeroOs?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface FetchPitometriaDwSpatialFiltros {
  polygon: object;
  dataInicio?: string;
  dataFim?: string;
  medicaoPressao?: boolean;
  medicaoVazao?: boolean;
  /** undefined = sem filtro (todos); [] = nenhum */
  fontesDados?: string[];
  incluirOcorrencia?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PitometriaDwService {
  constructor(
    private http: HttpClient,
    private getConfigService: GetConfigService,
  ) {}

  fetchMedicoesSpatial(
    filtros: FetchPitometriaDwSpatialFiltros,
  ): Observable<{ medicoes: MedicaoDw[]; total: number; truncado: boolean }> {
    const url = this.getConfigService.getUrl('pitometria-dw/spatial');
    const body: Record<string, unknown> = { polygon: filtros.polygon };
    if (filtros.dataInicio) body['dataInicio'] = filtros.dataInicio;
    if (filtros.dataFim) body['dataFim'] = filtros.dataFim;
    if (filtros.medicaoPressao !== undefined)
      body['medicaoPressao'] = filtros.medicaoPressao;
    if (filtros.medicaoVazao !== undefined)
      body['medicaoVazao'] = filtros.medicaoVazao;
    if (filtros.fontesDados !== undefined)
      body['fontesDados'] = filtros.fontesDados;
    if (filtros.incluirOcorrencia !== undefined)
      body['incluirOcorrencia'] = filtros.incluirOcorrencia;
    return this.http
      .post<{
        medicoes: MedicaoDw[];
        total: number;
        truncado: boolean;
      }>(url, body)
      .pipe(catchError((err) => throwError(() => err)));
  }

  fetchMedicoes(
    filtros: FetchPitometriaDwFiltros,
  ): Observable<{ medicoes: MedicaoDw[]; total: number; truncado: boolean }> {
    const url = this.getConfigService.getUrl('pitometria-dw');
    const params: Record<string, string> = {};
    if (filtros.codSimp) params['codSimp'] = filtros.codSimp;
    if (filtros.matricula) params['matricula'] = filtros.matricula;
    if (filtros.numeroOs) params['numeroOs'] = filtros.numeroOs;
    if (filtros.dataInicio) params['dataInicio'] = filtros.dataInicio;
    if (filtros.dataFim) params['dataFim'] = filtros.dataFim;

    return this.http
      .get<{
        medicoes: MedicaoDw[];
        total: number;
        truncado: boolean;
      }>(url, { params })
      .pipe(catchError((err) => throwError(() => err)));
  }
}
