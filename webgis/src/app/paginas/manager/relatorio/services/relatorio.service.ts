import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface RelatorioUsoData {
  kpis: {
    totalAcessos: number;
    totalAcessosAnterior: number;
    camadasAcessadas: number;
    totalCamadasAtivas: number;
    camadasAcessadasAnterior: number;
    mapasVisualizados: number;
    totalMapas: number;
    mapasVisualizadosAnterior: number;
    totalFavoritos: number;
  };
  acessosPorDia: { data: string; total: number }[];
  topCamadas: { cod: string; nome: string; grupo: string; acessos: number }[];
  tabela: {
    cod: string;
    nome: string;
    grupo: string;
    tema: string;
    acessos: number;
    favoritos: number;
  }[];
}

export interface RelatorioInventarioData {
  kpis: {
    ativas: number;
    inativas: number;
    raster: number;
    semAtributos: number;
  };
  porTema: { tema: string; total: number }[];
  porNivel: { nivel: string; total: number }[];
  tabela: {
    nome: string;
    titulo: string;
    grupo: string;
    tema: string;
    compartilhamento: string;
    totalAtributos: number;
    ativa: boolean;
    criadaEm: string;
  }[];
}

export interface UsuarioTabela {
  nome: string;
  email: string;
  perfil: string;
  ultimoAcesso: string | null;
  logins: number;
  ativo: boolean;
  camadas: number;
  mapas: number;
  raster: number;
  favoritos: number;
  ultimaAtividade: string | null;
}

export interface AtividadeItem {
  tipo: 'camada' | 'mapa';
  nome: string;
  acao: 'criou' | 'editou';
  usuario: string;
  data: string;
}

export interface RelatorioUsuariosData {
  kpis: { total: number; admins: number; editores: number; inativos: number };
  porPerfil: { perfil: string; total: number }[];
  tabela: UsuarioTabela[];
  atividadeRecente: AtividadeItem[];
}

@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly api = environment.base_url;

  constructor(private http: HttpClient) {}

  fetchUso(dataInicio: string, dataFim: string): Observable<RelatorioUsoData> {
    const params = new HttpParams()
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<RelatorioUsoData>(`${this.api}/relatorios/uso`, {
      params,
    });
  }

  fetchInventario(
    temaId?: string,
    ativo?: boolean,
  ): Observable<RelatorioInventarioData> {
    let params = new HttpParams();
    if (temaId) params = params.set('temaId', temaId);
    if (ativo !== undefined) params = params.set('ativo', String(ativo));
    return this.http.get<RelatorioInventarioData>(
      `${this.api}/relatorios/inventario`,
      { params },
    );
  }

  fetchUsuarios(
    perfil?: string,
    diasInativo?: number,
  ): Observable<RelatorioUsuariosData> {
    let params = new HttpParams();
    if (perfil) params = params.set('perfil', perfil);
    if (diasInativo !== undefined)
      params = params.set('diasInativo', String(diasInativo));
    return this.http.get<RelatorioUsuariosData>(
      `${this.api}/relatorios/usuarios`,
      { params },
    );
  }
}
