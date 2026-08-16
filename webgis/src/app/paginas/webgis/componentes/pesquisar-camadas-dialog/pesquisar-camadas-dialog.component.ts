import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Optional,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FetchContentService } from 'src/app/services/api/fetch.content.service';
import { FetchAtributosService } from 'src/app/services/api/fetch.atributos.camadas.service';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Atributos } from 'src/app/models/atributos.model';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CAMADAS_FILTRO_DEFAULT,
  TIPOS_CONSULTA,
} from './pesquisar-camadas-dialog.constants';
import {
  CamadaListItem,
  ConfigCamadaFiltro,
  LayerParaBusca,
  PesquisarCamadasDialogData,
  TipoConsultaDisponivel,
} from './pesquisar-camadas-dialog.types';
import {
  atributosPossuiNome,
  construirExpressaoFiltro,
  mapearTiposConsultaParaCamada,
  resolverColunaDv,
  resolverColunaMatricula,
} from './query/pesquisar-camadas-dialog.query-utils';
import { PesquisarCamadasDialogSearchFacade } from './search/pesquisar-camadas-dialog-search.facade';
import { PesquisarCamadasDialogMapFacade } from './map/pesquisar-camadas-dialog-map.facade';
import { PesquisarCamadasUiStore } from './pesquisar-camadas-ui.store';
import { WindowBehavior } from 'src/app/shared/window/window-behavior';

@Component({
  selector: 'app-pesquisar-camadas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './pesquisar-camadas-dialog.component.html',
  styleUrl: './pesquisar-camadas-dialog.component.scss',
})
export class PesquisarCamadasDialogComponent
  extends WindowBehavior
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('draggableWindow') override draggableWindow!: ElementRef<HTMLElement>;

  private static readonly GRUPO_BUSCA_CAMADAS_ID =
    'b25c70aa-729a-4e0b-b5f9-35a42fa18c0c';

  pesquisaTermo = '';
  todasAsCamadas: CamadaListItem[] = [];
  private fechadoPelaLupa = false;
  camadasFiltradas: CamadaListItem[] = [];
  carregando = true;
  erro: string | null = null;

  selectedLayer: LayerParaBusca | null = null;
  camadasFromConfig: ConfigCamadaFiltro[] = [];
  atributosCamada: Atributos[] = [];
  carregandoAtributos = false;
  tiposConsultaDisponiveis: TipoConsultaDisponivel[] = [];
  filtroSelecionado = '';
  valorFiltro = '';
  valorDv = '';
  mostrarFormularioValor = false;

  resultados: Record<string, unknown>[] = [];
  colunasResultados: string[] = [];
  colunasExibidas: string[] = [];
  dataSourceResultados = new MatTableDataSource<Record<string, unknown>>([]);
  carregandoResultados = false;
  erroResultados: string | null = null;

  constructor(
    @Optional()
    public dialogRef: MatDialogRef<PesquisarCamadasDialogComponent> | null,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public data: PesquisarCamadasDialogData | null | undefined,
    private contentService: FetchContentService,
    private fetchAtributosService: FetchAtributosService,
    private conteudoService: ConteudoService,
    private searchFacade: PesquisarCamadasDialogSearchFacade,
    private mapFacade: PesquisarCamadasDialogMapFacade,
    public uiStore: PesquisarCamadasUiStore,
    protected override cdr: ChangeDetectorRef,
  ) {
    super(cdr);
    this.defaultSize = { width: 420, height: 560 };
    this.minimizedSize = { width: 220, height: 42 };
  }

  ngAfterViewInit(): void {
    this.positionTopRight(16, 72);
    this.initWindowBehaviorLifecycle();
    this.cdr.detectChanges();
  }

  get camadasParaFiltro(): CamadaListItem[] {
    return this.todasAsCamadas.filter((c) => c.tipo === 'camada');
  }

  get labelTipoSelecionado(): string {
    const t = this.tiposConsultaDisponiveis.find(
      (x) => x.id === this.filtroSelecionado,
    );
    return t?.label ?? '';
  }

  private resetResultadosState(): void {
    this.resultados = [];
    this.colunasResultados = [];
    this.colunasExibidas = [];
    this.dataSourceResultados.data = [];
    this.erroResultados = null;
    this.carregandoResultados = false;
  }

  private resetSelecaoState(): void {
    this.selectedLayer = null;
    this.atributosCamada = [];
    this.valorFiltro = '';
    this.valorDv = '';
    this.resetResultadosState();
  }

  private resetTiposConsultaDisponiveis(): void {
    this.tiposConsultaDisponiveis = TIPOS_CONSULTA.map((t) => ({
      id: t.id,
      label: t.label,
      nomeAtributo: null as string | null,
    }));
  }

  private ativarCamadaSelecionadaSeNecessario(): void {
    this.resolverContextoCamadaSelecionadaPorNome();
    if (
      this.selectedLayer?.temaId &&
      this.selectedLayer?.grupoId &&
      this.selectedLayer?.camadaId
    ) {
      this.conteudoService.emitirAtivacaoCamadaComContexto(
        this.selectedLayer.temaId,
        this.selectedLayer.grupoId,
        this.selectedLayer.camadaId,
      );
      this.conteudoService.emitirToggleCamadaComContexto(
        this.selectedLayer.temaId,
        this.selectedLayer.grupoId,
        this.selectedLayer.camadaId,
        true,
      );
    }
  }

  private buscarCamadaContextoPorNome(): CamadaListItem | null {
    if (!this.selectedLayer?.nomeCamada) return null;
    return (
      this.todasAsCamadas.find(
        (c) =>
          c.tipo === 'camada' &&
          c.nomeCamada === this.selectedLayer?.nomeCamada,
      ) ?? null
    );
  }

  private resolverContextoCamadaSelecionadaPorNome(): void {
    if (!this.selectedLayer?.nomeCamada) return;
    if (
      this.selectedLayer.temaId &&
      this.selectedLayer.grupoId &&
      this.selectedLayer.camadaId
    ) {
      return;
    }

    const camadaContexto = this.buscarCamadaContextoPorNome();
    if (camadaContexto) {
      this.selectedLayer = {
        ...this.selectedLayer,
        camadaId: camadaContexto.id,
        grupoId: camadaContexto.grupoId,
        temaId: camadaContexto.temaId,
      };
      return;
    }

    for (const grupo of this.conteudoService.grupoCamadas) {
      const camada = (grupo.camadas || []).find(
        (c) => c.nomeCamada === this.selectedLayer?.nomeCamada,
      );
      if (camada) {
        this.selectedLayer = {
          ...this.selectedLayer,
          camadaId: camada.id,
          grupoId: grupo.id,
          temaId: camada.temaId,
        };
        return;
      }
    }
  }

  private construirColunasResultados(
    rows: Record<string, unknown>[],
  ): string[] {
    if (rows.length === 0) return [];

    const keys = Object.keys(rows[0]).filter((k) => k !== 'geometry');
    const temMatriculaLower = keys.includes('matricula');

    return keys.filter((k) => {
      if (k === 'matricula') return true;
      if (!temMatriculaLower) return true;
      return k.toLowerCase() !== 'matrícula';
    });
  }

  ngOnInit(): void {
    this.removerHighlightDoMapa();
    this.resetTiposConsultaDisponiveis();
    if (this.data?.camadas?.length) {
      this.camadasFromConfig = this.data.camadas;
    } else {
      this.camadasFromConfig = CAMADAS_FILTRO_DEFAULT.map((c) => ({
        ...c,
        colunaPorTipo: { ...c.colunaPorTipo },
      }));
    }
    this.carregarListaCamadas();
  }

  escolherTipo(tipo: { id: string; label: string }): void {
    this.filtroSelecionado = tipo.id;
    this.resetSelecaoState();
    this.resetTiposConsultaDisponiveis();
    this.mostrarFormularioValor = true;

    const config = this.camadasFromConfig.find((c) => c.colunaPorTipo[tipo.id]);
    if (config) {
      const camadaReal = this.todasAsCamadas.find(
        (c) => c.tipo === 'camada' && c.nomeCamada === config.nomeCamada,
      );
      this.selectedLayer = {
        id: camadaReal?.id ?? config.id,
        nomeCamada: config.nomeCamada,
        titulo: camadaReal?.titulo ?? config.titulo,
        temaId: camadaReal?.temaId,
        grupoId: camadaReal?.grupoId,
        camadaId: camadaReal?.id,
      };
      this.tiposConsultaDisponiveis = TIPOS_CONSULTA.map((t) => ({
        id: t.id,
        label: t.label,
        nomeAtributo:
          t.id === tipo.id ? config.colunaPorTipo[t.id] ?? null : null,
      }));
      this.carregarAtributosParaFiltro();
    }
  }

  /** Volta para a lista dos 11 tipos (passo 1). */
  voltarParaOpcoes(): void {
    this.mostrarFormularioValor = false;
    this.resetSelecaoState();
  }

  onCamadaChange(camada: CamadaListItem | LayerParaBusca | null): void {
    this.selectedLayer =
      camada && 'nomeCamada' in camada && camada.nomeCamada
        ? {
            id: camada.id,
            nomeCamada: camada.nomeCamada,
            titulo: camada.titulo ?? '',
            temaId: 'temaId' in camada ? camada.temaId : undefined,
            grupoId: 'grupoId' in camada ? camada.grupoId : undefined,
            camadaId: camada.id,
          }
        : null;
    this.resetResultadosState();
    this.atributosCamada = [];
    this.valorDv = '';
    if (this.selectedLayer) {
      this.carregarAtributosParaFiltro();
    } else {
      this.resetTiposConsultaDisponiveis();
    }
  }

  private removerHighlightDoMapa(): void {
    this.mapFacade.limparHighlight();
  }

  private carregarListaCamadas(): void {
    this.carregando = true;
    this.erro = null;

    const nomesCamadasAlvo = new Set(
      this.camadasFromConfig
        .map((c) => c.nomeCamada)
        .filter((nome): nome is string => !!nome),
    );

    this.contentService
      .getContent(PesquisarCamadasDialogComponent.GRUPO_BUSCA_CAMADAS_ID)
      .pipe(
        catchError(() => {
          this.erro = 'Não foi possível carregar as camadas de busca.';
          this.carregando = false;
          return of({ camadas: [], camadasRaster: [], mapas: [] });
        }),
      )
      .subscribe((conteudo) => {
        const lista: CamadaListItem[] = [];

        (conteudo.camadas || []).forEach((cam) => {
          if (!nomesCamadasAlvo.has(cam.nomeCamada)) return;
          lista.push({
            id: cam.id,
            titulo: cam.tituloCamada ?? cam.nomeCamada ?? '',
            tipo: 'camada',
            grupoNome: '',
            temaNome: '',
            grupoId: PesquisarCamadasDialogComponent.GRUPO_BUSCA_CAMADAS_ID,
            temaId: cam.temaId ?? '',
            nomeCamada: cam.nomeCamada,
            atributosNomes: [],
          });
        });

        this.todasAsCamadas = lista;
        this.carregarAtributosEDepoisAplicarFiltro();
      });
  }

  /** Carrega as colunas (atributos) das camadas vetoriais e então aplica o filtro e esconde o loading */
  private carregarAtributosEDepoisAplicarFiltro(): void {
    const camadasVetoriais = this.todasAsCamadas.filter(
      (c) => c.tipo === 'camada',
    );
    if (camadasVetoriais.length === 0) {
      this.carregando = false;
      this.aplicarFiltro();
      return;
    }

    const atributos$ = camadasVetoriais.map((item) =>
      this.fetchAtributosService.getAtributos(item.id).pipe(
        map((attrs) =>
          attrs
            .map((a) =>
              (a.label && a.label.trim()
                ? a.label
                : a.nomeAtributo ?? ''
              ).trim(),
            )
            .filter(Boolean),
        ),
        catchError(() => of([] as string[])),
      ),
    );

    forkJoin(atributos$).subscribe((resultados: string[][]) => {
      resultados.forEach((nomes: string[], idx: number) => {
        camadasVetoriais[idx].atributosNomes = nomes;
      });
      this.carregando = false;
      this.aplicarFiltro();
    });
  }

  aplicarFiltro(): void {
    const termo = (this.pesquisaTermo ?? '').trim().toLowerCase();
    if (!termo) {
      this.camadasFiltradas = [...this.todasAsCamadas];
      return;
    }
    this.camadasFiltradas = this.todasAsCamadas.filter((c) => {
      const bateNome =
        (c.titulo && c.titulo.toLowerCase().includes(termo)) ||
        (c.grupoNome && c.grupoNome.toLowerCase().includes(termo)) ||
        (c.temaNome && c.temaNome.toLowerCase().includes(termo)) ||
        (c.nomeCamada && c.nomeCamada.toLowerCase().includes(termo));
      const bateColuna =
        c.atributosNomes?.length > 0 &&
        c.atributosNomes.some((nome) => nome.toLowerCase().includes(termo));
      return bateNome || bateColuna;
    });
  }

  onPesquisaInput(): void {
    this.aplicarFiltro();
  }

  selecionar(camada: CamadaListItem): void {
    if (camada.tipo !== 'camada') {
      this.dialogRef?.close(camada);
      return;
    }
    this.selectedLayer =
      camada.nomeCamada != null
        ? {
            id: camada.id,
            nomeCamada: camada.nomeCamada,
            titulo: camada.titulo,
            temaId: camada.temaId,
            grupoId: camada.grupoId,
            camadaId: camada.id,
          }
        : null;
    this.filtroSelecionado = TIPOS_CONSULTA[0].id;
    this.resetTiposConsultaDisponiveis();
    this.valorFiltro = '';
    this.valorDv = '';
    this.resetResultadosState();
    this.carregarAtributosParaFiltro();
  }

  voltarParaLista(): void {
    this.selectedLayer = null;
    this.atributosCamada = [];
    this.valorDv = '';
    this.resetResultadosState();
  }

  private carregarAtributosParaFiltro(): void {
    if (!this.selectedLayer) return;
    this.carregandoAtributos = true;
    this.fetchAtributosService
      .getAtributos(this.selectedLayer.id)
      .pipe(catchError(() => of([] as Atributos[])))
      .subscribe((attrs) => {
        this.atributosCamada = (attrs || []).filter(
          (a) => a.nomeAtributo !== 'geom',
        );
        this.tiposConsultaDisponiveis = mapearTiposConsultaParaCamada(
          TIPOS_CONSULTA,
          this.atributosCamada,
        );
        // Preservar coluna da config quando a camada veio da config (ex.: Matrícula na ligacao)
        const config = this.camadasFromConfig.find(
          (c) =>
            c.id === this.selectedLayer?.id &&
            c.colunaPorTipo[this.filtroSelecionado],
        );
        if (config) {
          const col = config.colunaPorTipo[this.filtroSelecionado];
          if (atributosPossuiNome(this.atributosCamada, col)) {
            this.tiposConsultaDisponiveis = this.tiposConsultaDisponiveis.map(
              (t) =>
                t.id === this.filtroSelecionado
                  ? { ...t, nomeAtributo: col }
                  : t,
            );
          }
        }
        this.carregandoAtributos = false;
        if (
          !this.filtroSelecionado &&
          this.tiposConsultaDisponiveis.length > 0
        ) {
          this.filtroSelecionado = this.tiposConsultaDisponiveis[0].id;
        }
      });
  }

  private construirExpressao(): string | null {
    const nomeAtributoAtual = this.resolverColunaFiltroAtual();
    return construirExpressaoFiltro({
      filtroSelecionado: this.filtroSelecionado,
      valorFiltro: this.valorFiltro,
      valorDv: this.valorDv,
      tiposDisponiveis: this.tiposConsultaDisponiveis,
      tiposConsulta: TIPOS_CONSULTA,
      atributosCamada: this.atributosCamada,
      nomeCamada: this.selectedLayer?.nomeCamada,
      nomeAtributoAtual,
    });
  }

  private resolverColunaFiltroAtual(): string | null {
    const item = this.tiposConsultaDisponiveis.find(
      (t) => t.id === this.filtroSelecionado,
    );
    if (this.filtroSelecionado === 'matricula') {
      return resolverColunaMatricula(
        this.tiposConsultaDisponiveis,
        TIPOS_CONSULTA,
        this.atributosCamada,
        this.selectedLayer?.nomeCamada,
      );
    }
    if (item?.nomeAtributo) return item.nomeAtributo;

    const colunaDaConfig = this.camadasFromConfig.find(
      (c) => c.nomeCamada === this.selectedLayer?.nomeCamada,
    )?.colunaPorTipo?.[this.filtroSelecionado];
    if (colunaDaConfig) return colunaDaConfig;

    if (
      this.filtroSelecionado === 'codigo_hidrometro' &&
      this.selectedLayer?.nomeCamada === 'vw_ligacao'
    ) {
      return 'Hidrômetro';
    }

    return null;
  }

  buscarComFiltro(): void {
    if (!this.selectedLayer?.nomeCamada) return;
    if (!this.filtroSelecionado) {
      this.erroResultados = 'Selecione um tipo de consulta.';
      return;
    }
    const item = this.tiposConsultaDisponiveis.find(
      (t) => t.id === this.filtroSelecionado,
    );
    const nomeAtributoFiltro = this.resolverColunaFiltroAtual();
    if (!nomeAtributoFiltro) {
      this.erroResultados = `Esta camada não possui coluna correspondente a "${item?.label ?? this.filtroSelecionado}".`;
      return;
    }
    const val = this.valorFiltro?.trim() ?? '';
    if (!val) {
      this.erroResultados = 'Informe o valor para filtrar.';
      return;
    }
    if (this.filtroSelecionado === 'matricula') {
      if (!/^\d+$/.test(val)) {
        this.erroResultados = 'Matrícula deve ser um valor numérico.';
        return;
      }
      const dvAtributo = resolverColunaDv(this.atributosCamada);
      if (!dvAtributo) {
        this.erroResultados =
          'Esta camada não possui coluna de DV para a busca por matrícula.';
        return;
      }
      const dv = this.valorDv?.trim() ?? '';
      if (!dv) {
        this.erroResultados = 'Informe o DV da matrícula.';
        return;
      }
      if (!/^\d+$/.test(dv)) {
        this.erroResultados = 'DV deve ser um valor numérico.';
        return;
      }
    }
    const expressao = this.construirExpressao();
    if (!expressao) {
      this.erroResultados = 'Informe o valor para filtrar.';
      return;
    }
    this.erroResultados = null;
    this.executarBusca('expressao', expressao);
  }

  private executarBusca(tipoFiltro?: string, criterio?: string): void {
    if (!this.selectedLayer?.nomeCamada) return;
    const layerName = `content:${this.selectedLayer.nomeCamada}`;
    this.carregandoResultados = true;
    this.erroResultados = null;

    const itemFiltro = this.tiposConsultaDisponiveis.find(
      (t) => t.id === this.filtroSelecionado,
    );
    const nomeColunaFiltro = (
      this.resolverColunaFiltroAtual() ?? itemFiltro?.nomeAtributo?.trim()
    )?.trim();
    let atributosParaRequest = [...this.atributosCamada];
    const dvAtributo =
      this.filtroSelecionado === 'matricula'
        ? resolverColunaDv(this.atributosCamada)
        : null;
    atributosParaRequest = this.searchFacade.montarAtributosParaRequest({
      atributosCamada: this.atributosCamada,
      filtroSelecionado: this.filtroSelecionado,
      nomeColunaFiltro,
      dvAtributo,
    });

    this.searchFacade
      .buscarRowsDaCamada({
        layerName,
        atributosParaRequest,
        tipoFiltro,
        criterio,
      })
      .pipe(
        catchError(() => {
          this.erroResultados = 'Erro ao buscar dados da camada.';
          this.carregandoResultados = false;
          return of([]);
        }),
      )
      .subscribe((rows) => {
        this.carregandoResultados = false;
        const agrupados = this.agruparResultadosSeNecessario(rows);
        this.resultados = agrupados;
        this.colunasResultados = this.construirColunasResultados(agrupados);
        this.colunasExibidas = ['acoes', ...this.colunasResultados];
        this.dataSourceResultados.data = agrupados;
      });
  }

  /** Centraliza e aproxima o mapa no ponto/geometria do registro (botão lupa). */
  aproximarNoMapa(row: Record<string, unknown>): void {
    this.ativarCamadaSelecionadaSeNecessario();
    const erro = this.mapFacade.localizarGeometriaNoMapa(row['geometry']);
    if (erro) {
      this.erroResultados = erro;
      return;
    }
    this.erroResultados = null;
  }

  toggleCompacto(): void {
    if (this.isMinimized) {
      this.maximizeWindow();
    } else {
      this.minimizeWindow();
    }
  }

  fechar(): void {
    this.mapFacade.limparHighlight();
    if (this.dialogRef) {
      this.dialogRef.close();
      return;
    }
    this.uiStore.fechar();
  }

  override ngOnDestroy(): void {
    if (!this.fechadoPelaLupa) {
      this.mapFacade.limparHighlight();
    }
    super.ngOnDestroy();
  }

  private agruparResultadosSeNecessario(
    rows: Record<string, unknown>[],
  ): Record<string, unknown>[] {
    const config = this.camadasFromConfig.find(
      (c) => c.nomeCamada === this.selectedLayer?.nomeCamada,
    );
    if (!config?.agruparPor || rows.length === 0) return rows;

    const coluna = config.agruparPor;
    const grupos = new Map<string, Record<string, unknown>[]>();
    for (const row of rows) {
      const chave = String(row[coluna] ?? '');
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(row);
    }

    return Array.from(grupos.values()).map((grupo) => {
      const representante = { ...grupo[0] };
      if (grupo.length > 1) {
        const coords = grupo
          .map((r) => r['geometry'] as { type?: string; coordinates?: unknown[] })
          .filter((g) => g?.coordinates)
          .flatMap((g) =>
            g.type === 'MultiLineString'
              ? (g.coordinates as unknown[][])
              : [g.coordinates as unknown[]],
          );
        representante['geometry'] = {
          type: 'MultiLineString',
          coordinates: coords,
        };
      }
      return representante;
    });
  }

  getIconTipo(tipo: string): string {
    switch (tipo) {
      case 'camada':
        return 'layers';
      case 'raster':
        return 'grid_on';
      case 'mapa':
        return 'map';
      default:
        return 'layers';
    }
  }
}
