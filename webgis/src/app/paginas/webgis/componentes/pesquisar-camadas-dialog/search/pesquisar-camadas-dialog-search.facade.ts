import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Atributos } from 'src/app/models/atributos.model';
import { ConteudoService } from 'src/app/services/api/conteudo.service';

@Injectable({
  providedIn: 'root',
})
export class PesquisarCamadasDialogSearchFacade {
  constructor(private conteudoService: ConteudoService) {}

  montarAtributosParaRequest(params: {
    atributosCamada: Atributos[];
    filtroSelecionado: string;
    nomeColunaFiltro?: string | null;
    dvAtributo?: string | null;
  }): Atributos[] {
    let atributosParaRequest = [...params.atributosCamada];

    if (
      params.nomeColunaFiltro &&
      !atributosParaRequest.some(
        (a) => (a.nomeAtributo ?? '').trim() === params.nomeColunaFiltro,
      )
    ) {
      atributosParaRequest = [
        ...atributosParaRequest,
        { nomeAtributo: params.nomeColunaFiltro } as Atributos,
      ];
    }

    if (params.filtroSelecionado === 'matricula') {
      const colunasMatriculaExtras = ['matricula', 'Matrícula'];
      colunasMatriculaExtras.forEach((col) => {
        if (
          !atributosParaRequest.some((a) => (a.nomeAtributo ?? '').trim() === col)
        ) {
          atributosParaRequest = [
            ...atributosParaRequest,
            { nomeAtributo: col } as Atributos,
          ];
        }
      });

      if (
        params.dvAtributo &&
        !atributosParaRequest.some(
          (a) => (a.nomeAtributo ?? '').trim() === params.dvAtributo,
        )
      ) {
        atributosParaRequest = [
          ...atributosParaRequest,
          { nomeAtributo: params.dvAtributo } as Atributos,
        ];
      }
    }

    return atributosParaRequest;
  }

  buscarRowsDaCamada(params: {
    layerName: string;
    atributosParaRequest: Atributos[];
    tipoFiltro?: string;
    criterio?: string;
  }): Observable<Record<string, unknown>[]> {
    return this.conteudoService
      .getWFSLayerData(
        'camada',
        params.layerName,
        params.atributosParaRequest,
        params.tipoFiltro,
        params.criterio,
      )
      .pipe(
        map((dados) => {
          const layerData = Array.isArray(dados) ? dados[0]?.data : dados;
          const features = layerData?.features ?? [];
          const rows: Record<string, unknown>[] = [];
          features.forEach(
            (f: { properties?: Record<string, unknown>; geometry?: unknown }) => {
              if (f.properties && typeof f.properties === 'object') {
                const row = { ...f.properties };
                if (f.geometry !== undefined) row['geometry'] = f.geometry;
                rows.push(row);
              }
            },
          );
          return rows;
        }),
      );
  }
}
