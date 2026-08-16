import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GetConfigService } from '../get.config.service';
import {
  GrupoConfigPayload,
  GrupoDetalheResponse,
  GrupoOverview,
  ItemDisponivelGrupo,
  UsuarioDisponivel,
} from '../../models/grupo-membros.model';

@Injectable({
  providedIn: 'root',
})
export class GruposService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService,
    private getConfigService: GetConfigService,
  ) {}

  private headers(): HttpHeaders {
    const token = this.cookieService.get('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  fetchOverview(): Observable<{ grupos: GrupoOverview[] }> {
    return this.http.get<{ grupos: GrupoOverview[] }>(
      this.getConfigService.getUrl('grupos/overview'),
      { headers: this.headers() },
    );
  }

  /**
   * Filtra uma lista de grupos (ex.: opções de um select) mantendo apenas os grupos em
   * que o usuário atual é dono ou membro. Usado para evitar que um Publicador escolha um
   * grupo no qual o backend vai recusar a publicação (Admin já é filtrado antes de chamar
   * este método). Em caso de falha ao buscar o overview, retorna a lista original sem
   * filtrar (fail-open) — o backend continua sendo a fonte de verdade da regra.
   */
  filtrarGruposPorMembership<T extends { id: string }>(
    grupos: T[],
  ): Observable<T[]> {
    return this.fetchOverview().pipe(
      map((res) => {
        const idsPermitidos = new Set(
          res.grupos
            .filter((g) => g.membership === 'dono' || g.membership === 'membro')
            .map((g) => g.id),
        );
        return grupos.filter((g) => idsPermitidos.has(g.id));
      }),
      catchError(() => of(grupos)),
    );
  }

  getGrupo(grupoId: string): Observable<GrupoDetalheResponse> {
    return this.http.get<GrupoDetalheResponse>(
      this.getConfigService.getUrl(`grupos/${grupoId}`),
      { headers: this.headers() },
    );
  }

  updateConfig(grupoId: string, payload: GrupoConfigPayload): Observable<void> {
    return this.http.put<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/config`),
      payload,
      { headers: this.headers() },
    );
  }

  addMembro(grupoId: string, userId: string): Observable<void> {
    return this.http.post<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/membros`),
      { userId },
      { headers: this.headers() },
    );
  }

  removeMembro(grupoId: string, userId: string): Observable<void> {
    return this.http.delete<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/membros/${userId}`),
      { headers: this.headers() },
    );
  }

  solicitarParticipacao(grupoId: string): Observable<void> {
    return this.http.post<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/solicitacoes`),
      {},
      { headers: this.headers() },
    );
  }

  responderSolicitacao(
    grupoId: string,
    userId: string,
    aprovar: boolean,
  ): Observable<void> {
    return this.http.put<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/solicitacoes/${userId}`),
      { aprovar },
      { headers: this.headers() },
    );
  }

  participar(grupoId: string): Observable<void> {
    return this.http.post<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/participar`),
      {},
      { headers: this.headers() },
    );
  }

  sair(grupoId: string): Observable<void> {
    return this.http.post<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/sair`),
      {},
      { headers: this.headers() },
    );
  }

  fetchUsuariosDisponiveis(): Observable<{ usuarios: UsuarioDisponivel[] }> {
    return this.http.get<{ usuarios: UsuarioDisponivel[] }>(
      this.getConfigService.getUrl('grupos/usuarios-disponiveis'),
      { headers: this.headers() },
    );
  }

  /** Conteúdo do grupo — reusa o endpoint do índice/webgis, já filtrado pela policy no backend. */
  fetchConteudoGrupo(grupoId: string): Observable<{
    camadas: any[];
    camadasRaster: any[];
    mapas: any[];
  }> {
    return this.http.get<{
      camadas: any[];
      camadasRaster: any[];
      mapas: any[];
    }>(this.getConfigService.getUrl(`fetch-content/${grupoId}`), {
      headers: this.headers(),
    });
  }

  moverItens(
    grupoOrigemId: string,
    grupoDestinoId: string,
  ): Observable<{ qtdItensMovidos: number }> {
    return this.http.put<{ qtdItensMovidos: number }>(
      this.getConfigService.getUrl(`grupos/${grupoOrigemId}/mover-itens`),
      { grupoDestinoId },
      { headers: this.headers() },
    );
  }

  adicionarItem(
    grupoId: string,
    tipo: 'camada' | 'raster' | 'mapa',
    itemId: string,
  ): Observable<void> {
    return this.http.post<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/itens`),
      { tipo, itemId },
      { headers: this.headers() },
    );
  }

  removerItem(
    grupoId: string,
    tipo: 'camada' | 'raster' | 'mapa',
    itemId: string,
  ): Observable<void> {
    return this.http.delete<void>(
      this.getConfigService.getUrl(`grupos/${grupoId}/itens/${tipo}/${itemId}`),
      { headers: this.headers() },
    );
  }

  fetchItensDisponiveis(grupoId: string): Observable<{
    camadas: ItemDisponivelGrupo[];
    camadasRaster: ItemDisponivelGrupo[];
    mapas: ItemDisponivelGrupo[];
  }> {
    return this.http.get<{
      camadas: ItemDisponivelGrupo[];
      camadasRaster: ItemDisponivelGrupo[];
      mapas: ItemDisponivelGrupo[];
    }>(this.getConfigService.getUrl(`grupos/${grupoId}/itens-disponiveis`), {
      headers: this.headers(),
    });
  }
}
