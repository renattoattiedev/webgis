import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { FetchTemasService } from 'src/app/services/api/fetch.temas.service';
import { FetchGrupoTemaService } from 'src/app/services/api/fetch.grupo.tema.service';
import { FetchContentService } from 'src/app/services/api/fetch.content.service';
import { MapaService } from 'src/app/services/mapa.service';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  forkJoin,
  map,
  mergeMap,
  of,
  Subscription,
  firstValueFrom,
} from 'rxjs';
import { take } from 'rxjs/operators';
import { CreateLogCamadaService } from 'src/app/services/api/create.log.camada.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { ActivatedRoute } from '@angular/router';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import { CreateLogMapaService } from 'src/app/services/api/create.log.mapa.service';
import { transformExtent } from 'ol/proj';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { Grupos } from 'src/app/models/grupo.model';
import { ThumbnailCacheService } from 'src/app/services/thumbnail-cache.service';
import { UserPreferencesService } from 'src/app/services/api/user-preferences.service';
import { SelectedLayerRef } from 'src/app/models/user-preferences.model';
import { Tema } from 'src/app/models/temas.model';
import { FetchCarregamentoDefaultService } from 'src/app/services/api/fetch.carregamento.default.service';
import { createRasterTileLayer } from 'src/app/services/ol-raster-source.factory';
import { ThematicLayerService } from '../thematic/layer/thematic-layer.service';
import { findThematicSpec } from '../thematic/thematic-specs';

@Component({
  selector: 'app-adicionar-dados',
  templateUrl: './adicionar-dados.component.html',
  styleUrls: ['./adicionar-dados.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatDividerModule,
    NgIf,
    NgFor,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatToolbarModule,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#4DA9E7',
      },
    },
  ],
})
export class AdicionarDadosComponent implements OnDestroy {
  selected: string | undefined;
  temaSelecionado = '';
  pesquisaTermo = '';
  ordemAscendente: boolean | null = null;
  grupoSelecionado = '';
  urlWms: string | undefined;
  private camadaRemovidaSubscription!: Subscription;
  thumbnailUrls: Map<string, string> = new Map();
  loading: Map<string, boolean> = new Map();
  thumbnailErrors: Map<string, boolean> = new Map();

  // Performance optimization properties
  private intersectionObserver!: IntersectionObserver;
  private loadingQueue: string[] = [];
  private activeRequests = 0;
  private readonly MAX_CONCURRENT_REQUESTS = 3; // Menor que organization-content pois é painel lateral
  private loadedItems = new Set<string>();

  private estadoPorTema: {
    [temaId: string]: {
      [grupoId: string]: {
        visivel: boolean;
        camadas: { [camadaId: string]: boolean };
        mapas: { [mapaId: string]: boolean };
      };
    };
  } = {};

  constructor(
    private temasService: FetchTemasService,
    private grupoCamadasService: FetchGrupoTemaService,
    private fetchCamadasService: FetchContentService,
    private mapaService: MapaService,
    public conteudoService: ConteudoService,
    public createLogCamadaService: CreateLogCamadaService,
    public createLogMapaService: CreateLogMapaService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private route: ActivatedRoute,
    private fetchConfigService: FetchConfigsService,
    private cdr: ChangeDetectorRef,
    private thumbnailCacheService: ThumbnailCacheService,
    private userPreferencesService: UserPreferencesService,
    private fetchCarregamentoDefaultService: FetchCarregamentoDefaultService,
    private thematicLayerService: ThematicLayerService,
  ) {
    proj4.defs(
      'EPSG:31984',
      '+proj=utm +zone=24 +south +datum=WGS84 +units=m +no_defs',
    );
    register(proj4);

    this.conteudoService.atualizarGruposObservable.subscribe(() => {
      this.loadGrupoConteudo(this.temaSelecionado);
    });
  }

  async ngOnInit() {
    this.setupIntersectionObserver();

    this.camadaRemovidaSubscription =
      this.conteudoService.camadaRemovida$.subscribe((camada) => {
        this.atualizarEstadoCamadas(camada.nomeCamada, camada.status);
      });
    try {
      const configs = await this.fetchConfigService.getConfigs().toPromise();
      if (!configs) {
        return;
      }
      const urlWmsConfig = configs.find(
        (config) => config.key === 'GEOSERVER_URL',
      );
      this.urlWms =
        typeof urlWmsConfig?.value === 'string'
          ? urlWmsConfig.value
          : undefined;

      const temas = await this.temasService.getTemas().toPromise();
      if (!temas) {
        return;
      }
      this.conteudoService.setEmptyTemas();
      for (const tema of temas) {
        this.conteudoService.adicionarTema(tema);
      }

      this.route.queryParams.subscribe(async (params) => {
        const temaId = params['tema'];
        const grupoConteudoId = params['grupoConteudo'];
        const conteudoId = params['conteudo'];

        if (temaId) {
          this.temaSelecionado = temaId;

          await this.loadGrupoConteudo(temaId);

          const grupo = this.conteudoService.grupoCamadas.find(
            (g) => g.id === grupoConteudoId,
          );

          if (grupo) {
            const conteudoCamadas = grupo.camadas.find(
              (c) => c.id === conteudoId,
            );
            if (conteudoCamadas) {
              this.toggleCamada(grupoConteudoId, conteudoId, true);
            }

            const conteudoCamadasRaster = grupo.camadasRaster.find(
              (c) => c.id === conteudoId,
            );
            if (conteudoCamadasRaster) {
              this.toggleCamadaRaster(grupoConteudoId, conteudoId, true);
            }

            const conteudoMapas = grupo.mapas.find((c) => c.id === conteudoId);
            if (conteudoMapas) {
              this.toggleMapa(grupoConteudoId, conteudoId, true);
            }
          }
        }
        this.cdr.detectChanges();
        this.attemptApplyPreferences();
      });
      if (!this.userPreferencesService.getCurrentPreference()) {
        this.userPreferencesService
          .fetchPreference()
          .pipe(take(1))
          .subscribe(() => {
            this.attemptApplyPreferences();
          });
      } else {
        this.attemptApplyPreferences();
      }
    } catch (error) {
      console.error('Erro durante a inicialização:', error);
    }

    this.conteudoService.ativarCamadaContexto$.subscribe((payload: any) => {
      console.log('Recebido no subscribe:', payload);
      if (!(payload && payload.temaId && payload.grupoId && payload.camadaId))
        return;

      (async () => {
        try {
          await this.garantirTemaCarregado(payload.temaId);
          const layerIdsAtivadas = this.ativarCamadaPorContexto(
            payload.grupoId,
            payload.camadaId,
          );
          layerIdsAtivadas.forEach((layerId) =>
            this.trazerCamadaParaFrente(layerId),
          );
          this.cdr.detectChanges();
        } catch (e) {
          console.error('Erro ao ativar camada via contexto:', e);
        }
      })();
    });

    this.conteudoService.toggleCamadaContexto$.subscribe((payload: any) => {
      if (
        !(
          payload &&
          payload.temaId &&
          payload.grupoId &&
          payload.camadaId &&
          typeof payload.ativo === 'boolean'
        )
      )
        return;
      const { temaId, grupoId, camadaId, ativo } = payload;

      const ensureTemaLoaded = async () => {
        if (this.temaSelecionado !== temaId) {
          this.salvarEstadoTema(this.temaSelecionado);
          this.temaSelecionado = temaId;
          this.selected = temaId;
          await this.loadGrupoConteudo(temaId);
        }
      };

      (async () => {
        try {
          await ensureTemaLoaded();
          this.toggleCamada(grupoId, camadaId, ativo);
          this.cdr.detectChanges();
        } catch (e) {
          console.error('Erro ao alternar camada via contexto:', e);
        }
      })();
    });

    this.conteudoService.refreshCamadaContexto$.subscribe((payload: any) => {
      if (!(payload && payload.temaId && payload.grupoId && payload.camadaId))
        return;
      const { temaId, grupoId, camadaId, hard, layerId, layersParam } = payload;

      (async () => {
        try {
          const refreshDireto = this.refreshCamadasWmsDiretas(
            layerId,
            layersParam,
            !!hard,
          );

          if (refreshDireto === 0) {
            await this.garantirTemaCarregado(temaId);
            const layerIdsAtivadas = this.ativarCamadaPorContexto(
              grupoId,
              camadaId,
            );
            layerIdsAtivadas.forEach((id) =>
              this.refreshLayerWmsById(id, !!hard),
            );
            layerIdsAtivadas.forEach((id) => this.trazerCamadaParaFrente(id));
          }

          this.cdr.detectChanges();
        } catch (e) {
          console.error('Erro ao atualizar camada via contexto:', e);
        }
      })();
    });
    this.userPreferencesService.preference$.subscribe(() => {
      this.attemptApplyPreferences();
    });
    this.scheduleDefaultLoadingActivation();
  }

  private scheduleDefaultLoadingActivation(): void {
    setTimeout(() => {
      this.activateDefaultLoadingItems();
    }, 1500);
  }

  private activateDefaultLoadingItems(): void {
    this.fetchCarregamentoDefaultService.getCarregamentoPadrao().subscribe({
      next: async (response) => {
        if (!response || !response.conteudo || response.conteudo.length === 0) {
          console.log(
            '[CarregamentoPadrao] Nenhum item com carregamento padrão encontrado',
          );
          return;
        }

        const itemsParaAtivar = response.conteudo.filter(
          (item) => item.carregamentoDefault === true,
        );

        if (itemsParaAtivar.length === 0) {
          console.log(
            '[CarregamentoPadrao] Nenhum item com carregamentoDefault === true',
          );
          return;
        }

        console.log(
          `[CarregamentoPadrao] Ativando ${itemsParaAtivar.length} itens com carregamento padrão`,
        );

        const porTema = new Map<string, any[]>();
        itemsParaAtivar.forEach((item) => {
          if (!porTema.has(item.temaId)) {
            porTema.set(item.temaId, []);
          }
          porTema.get(item.temaId)!.push(item);
        });

        for (const [temaId, itens] of porTema) {
          await this.ativarItensPorTema(temaId, itens);
          await this.delay(300);
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(
          '[CarregamentoPadrao] Erro ao buscar itens de carregamento padrão:',
          error,
        );
      },
    });
  }

  private async ativarItensPorTema(
    temaId: string,
    itens: any[],
  ): Promise<void> {
    try {
      if (this.temaSelecionado !== temaId) {
        this.salvarEstadoTema(this.temaSelecionado);
        this.temaSelecionado = temaId;
        this.selected = temaId;
        await this.loadGrupoConteudo(temaId);
      }

      await firstValueFrom(this.mapaService.getMapaObservable().pipe(take(1)));

      for (const item of itens) {
        await this.ativarItemPorTipo(item);
        await this.delay(200);
      }
    } catch (error) {
      console.error(
        `[CarregamentoPadrao] Erro ao ativar itens do tema ${temaId}:`,
        error,
      );
    }
  }

  private async ativarItemPorTipo(item: any): Promise<void> {
    try {
      const grupo = this.conteudoService.grupoCamadas.find(
        (g) => g.id === item.grupoId,
      );
      if (!grupo) {
        console.warn(
          `[CarregamentoPadrao] Grupo ${item.grupoId} não encontrado`,
        );
        return;
      }

      this.grupoSelecionado = grupo.id;
      grupo.visivel = true;

      if (item.tipo === 'V') {
        const camada = grupo.camadas.find((c) => c.id === item.id);
        if (camada) {
          this.toggleCamada(grupo.id, camada.id, true, false);
          await this.delay(this.DELAY_VECTOR_MS);
        } else {
          console.warn(
            `[CarregamentoPadrao] Camada vetorial ${item.id} não encontrada em grupo ${grupo.id}`,
          );
        }
      } else if (item.tipo === 'R') {
        const raster = grupo.camadasRaster.find((r) => r.id === item.id);
        if (raster) {
          this.toggleCamadaRaster(grupo.id, raster.id, true, false);
          await this.delay(this.DELAY_RASTER_MS);
        } else {
          console.warn(
            `[CarregamentoPadrao] Camada raster ${item.id} não encontrada em grupo ${grupo.id}`,
          );
        }
      } else if (item.tipo === 'M') {
        const mapa = grupo.mapas.find((m) => m.id === item.id);
        if (mapa) {
          this.toggleMapa(grupo.id, mapa.id, true, false);
          await this.delay(this.DELAY_MAP_MS);
        } else {
          console.warn(
            `[CarregamentoPadrao] Mapa ${item.id} não encontrado em grupo ${grupo.id}`,
          );
        }
      }
    } catch (error) {
      console.error(`[CarregamentoPadrao] Erro ao ativar item:`, error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
  }

  private isLayerAlreadyActive(
    temaId: string,
    grupoId: string,
    camadaId: string,
  ): boolean {
    if (this.temaSelecionado === temaId) {
      const grupoAtual = this.conteudoService.grupoCamadas.find(
        (g) => g.id === grupoId,
      );
      const camadaAtual = grupoAtual?.camadas?.find((c) => c.id === camadaId);
      if (camadaAtual?.visivel) return true;

      const nomeCamada = camadaAtual?.nomeCamada;
      if (nomeCamada) {
        const layerId = `content:${nomeCamada}`;
        if (this.isLayerOnMap(layerId)) return true;
      }
    }

    const visivelEstado =
      this.estadoPorTema?.[temaId]?.[grupoId]?.camadas?.[camadaId];
    if (visivelEstado === true) return true;

    return false;
  }

  private isLayerOnMap(layerId: string): boolean {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return false;
    const layers = mapa.getLayers().getArray();
    return layers.some(
      (l) => typeof l.get === 'function' && l.get('id') === layerId,
    );
  }

  private async garantirTemaCarregado(temaId: string): Promise<void> {
    if (this.temaSelecionado !== temaId) {
      this.salvarEstadoTema(this.temaSelecionado);
      this.temaSelecionado = temaId;
      this.selected = temaId;
      await this.loadGrupoConteudo(temaId);
    }
  }

  private ativarCamadaPorContexto(grupoId: string, camadaId: string): string[] {
    const grupo = this.conteudoService.grupoCamadas.find(
      (g) => g.id === grupoId,
    );
    if (!grupo) return [];

    const camadaVetorial = grupo.camadas?.find((c) => c.id === camadaId);
    if (camadaVetorial) {
      const layerId = `content:${camadaVetorial.nomeCamada}`;
      if (!camadaVetorial.visivel || !this.isLayerOnMap(layerId)) {
        this.toggleCamada(grupoId, camadaId, true);
      }
      return [layerId];
    }

    const camadaRaster = grupo.camadasRaster?.find((c) => c.id === camadaId);
    if (camadaRaster) {
      const layerId = `content:${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`;
      if (!camadaRaster.visivel || !this.isLayerOnMap(layerId)) {
        this.toggleCamadaRaster(grupoId, camadaId, true);
      }
      return [layerId];
    }

    const mapaItem = grupo.mapas?.find((m) => m.id === camadaId);
    if (mapaItem) {
      if (!mapaItem.visivel) {
        this.toggleMapa(grupoId, camadaId, true);
      }

      const layerIds: string[] = [];
      (mapaItem.camadas || []).forEach((c: any) =>
        layerIds.push(`content:${mapaItem.nomeMapa}_${c.nomeCamada}`),
      );
      (mapaItem.camadasRaster || []).forEach((c: any) =>
        layerIds.push(
          `content:${mapaItem.nomeMapa}_${c.nomeCamada}_${c.fonteDadosCamadaRaster}`,
        ),
      );
      return layerIds;
    }

    return [];
  }

  private trazerCamadaParaFrente(layerId: string): void {
    const mapa = this.mapaService.getMapa();
    if (!mapa || !layerId) return;

    const layer = mapa
      .getLayers()
      .getArray()
      .find((l) => l.get('id') === layerId);
    if (!layer) return;

    this.moverConteudoParaTopo(layerId);

    mapa.removeLayer(layer);
    mapa.addLayer(layer);
    mapa.renderSync();
  }

  private refreshLayerWmsById(layerId: string, hard = false): void {
    const mapa = this.mapaService.getMapa();
    if (!mapa || !layerId) return;

    const layer: any = mapa
      .getLayers()
      .getArray()
      .find((l) => l.get('id') === layerId);
    if (!layer) return;

    const source: any = layer.getSource?.();
    const params = source?.getParams?.();
    if (params && source?.updateParams) {
      source.updateParams({
        ...params,
        _t: Date.now(),
        ...(hard ? { _hard: Date.now() } : {}),
      });
    }
    if (source?.refresh) source.refresh();
    if (layer?.changed) layer.changed();
  }

  private refreshCamadasWmsDiretas(
    layerId?: string,
    layersParam?: string,
    hard = false,
  ): number {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return 0;

    const targetLayerId = (layerId || '').toLowerCase();
    const targetLayersParam = (layersParam || '').toLowerCase();
    let count = 0;

    mapa
      .getLayers()
      .getArray()
      .forEach((layer: any) => {
        const id = String(layer?.get?.('id') ?? '').toLowerCase();
        const source = layer?.getSource?.();
        const params = source?.getParams?.();
        const layers = String(params?.LAYERS ?? '').toLowerCase();

        const byId = !!targetLayerId && id === targetLayerId;
        const byLayersParam =
          !!targetLayersParam &&
          layers
            .split(',')
            .map((x: string) => x.trim())
            .includes(targetLayersParam);
        if (!byId && !byLayersParam) return;

        if (params && source?.updateParams) {
          source.updateParams({
            ...params,
            _t: Date.now(),
            ...(hard ? { _hard: Date.now() } : {}),
          });
        }
        if (source?.refresh) source.refresh();
        if (layer?.changed) layer.changed();
        count++;
      });

    if (count > 0) {
      mapa.renderSync();
      if (targetLayerId) this.trazerCamadaParaFrente(targetLayerId);
    }

    return count;
  }

  private moverConteudoParaTopo(layerId: string): void {
    const nomeNormalizado = layerId.startsWith('content:')
      ? layerId.substring(8)
      : layerId;

    const moverNoArray = (arr: any[]) => {
      const index = arr.findIndex(
        (item) => item?.nomeConteudo === nomeNormalizado,
      );
      if (index <= 0) return;
      const [item] = arr.splice(index, 1);
      arr.unshift(item);
    };

    moverNoArray(this.conteudoService.dadosAdicionais);
    moverNoArray(this.conteudoService.dadosAdicionaisFiltro);
  }

  async mudarTemaEAtivarCamada(
    temaId: string,
    grupoId: string,
    camadaId: string,
  ) {
    if (this.temaSelecionado !== temaId) {
      this.salvarEstadoTema(this.temaSelecionado);
      this.temaSelecionado = temaId;
      this.selected = temaId;
      await this.loadGrupoConteudo(temaId);
    }

    this.toggleCamada(grupoId, camadaId, true);
    this.cdr.detectChanges();
  }

  loadGrupoConteudo(idTema: string): Promise<void> {
    this.conteudoService.grupoCamadas = [];
    this.cdr.detectChanges();
    return new Promise((resolve, reject) => {
      this.grupoCamadasService.getGrupo(idTema).subscribe(
        (grupoCamadas) => {
          const gruposAdaptados: Grupos[] = grupoCamadas.map((grupo) => ({
            ...grupo,
            camadas: grupo.camadas || [],
            camadasRaster: grupo.camadasRaster || [],
            mapas: grupo.mapas || [],
          }));

          this.conteudoService.grupoCamadas = gruposAdaptados;

          const observables = gruposAdaptados.map((grupo) =>
            this.fetchCamadasService.getContent(grupo.id).pipe(
              mergeMap((result) => {
                grupo.mapas = result.mapas.map((mapa) => ({
                  ...mapa,
                  visivel: false,
                }));
                grupo.camadas = result.camadas.map((camada) => ({
                  ...camada,
                  visivel: false,
                }));
                grupo.camadasRaster = result.camadasRaster.map(
                  (camadasRaster) => ({
                    ...camadasRaster,
                    visivel: false,
                  }),
                );
                return of(grupo);
              }),
            ),
          );

          forkJoin(observables).subscribe(
            () => {
              this.restaurarEstadoTema(idTema);
              this.attemptApplyPreferences();
              resolve();
            },
            (error) => {
              console.error('Erro ao carregar conteúdo:', error);
              reject(error);
            },
          );
        },
        (error) => {
          console.error('Erro ao carregar grupos:', error);
          reject(error);
        },
      );
    });
  }

  private preferenciasAplicadas = false;
  private preferenciasEmProcessamento = false;
  private temasQueue: string[] = [];
  private queueIndex = 0;
  private readonly DELAY_VECTOR_MS = 450;
  private readonly DELAY_RASTER_MS = 500;
  private readonly DELAY_MAP_MS = 700;
  private readonly DELAY_NOT_FOUND_MS = 120;
  private readonly WAIT_STEP_MS = 120;
  private readonly WAIT_TIMEOUT_MS = 4000;

  private attemptApplyPreferences(): void {
    if (this.preferenciasAplicadas || this.preferenciasEmProcessamento) return;
    const pref = this.userPreferencesService.getCurrentPreference();
    if (!pref) return;

    const selecionados: SelectedLayerRef[] = pref.selectedLayers || [];
    if (!selecionados.length) return;
    this.temasQueue = [];
    selecionados.forEach((s) => {
      if (s.temaId && !this.temasQueue.includes(s.temaId)) {
        this.temasQueue.push(s.temaId);
      }
    });
    if (this.temasQueue.length === 0) return;

    this.preferenciasEmProcessamento = true;
    this.queueIndex = 0;
    this.processPreferencesQueue(pref, selecionados);
  }

  private async mudarTemaParaPreferencias(temaId: string, pref: any) {
    try {
      this.salvarEstadoTema(this.temaSelecionado);
      this.temaSelecionado = temaId;
      this.selected = temaId;
      await this.loadGrupoConteudo(temaId);
      const prefAtual = this.userPreferencesService.getCurrentPreference();
      const selecionados: SelectedLayerRef[] = prefAtual?.selectedLayers || [];
      this.mapaService
        .getMapaObservable()
        .pipe(take(1))
        .subscribe(async () => {
          const ativou = await this.ativarSelecionadosNoTemaAtual(selecionados);
          if (ativou) {
            this.preferenciasAplicadas = true;
            this.userPreferencesService.applyPreference(prefAtual);
          }
          this.cdr.detectChanges();
        });
    } catch (e) {
      console.warn('Falha ao mudar tema para aplicar preferências', e);
    }
  }

  private async processPreferencesQueue(
    pref: any,
    selecionados: SelectedLayerRef[],
  ) {
    try {
      while (this.queueIndex < this.temasQueue.length) {
        const temaId = this.temasQueue[this.queueIndex];

        if (this.temaSelecionado !== temaId) {
          this.salvarEstadoTema(this.temaSelecionado);
          this.temaSelecionado = temaId;
          this.selected = temaId;
          await this.loadGrupoConteudo(temaId);
        } else {
          const nenhumConteudoCarregado =
            !this.conteudoService.grupoCamadas ||
            this.conteudoService.grupoCamadas.every(
              (g) =>
                (g.camadas?.length || 0) === 0 &&
                (g.camadasRaster?.length || 0) === 0 &&
                (g.mapas?.length || 0) === 0,
            );
          if (nenhumConteudoCarregado) {
            await this.loadGrupoConteudo(temaId);
          }
        }

        await firstValueFrom(
          this.mapaService.getMapaObservable().pipe(take(1)),
        );

        const ativou = await this.ativarSelecionadosNoTemaAtual(selecionados);
        this.userPreferencesService.applyPreference(pref);

        this.queueIndex++;
        this.cdr.detectChanges();
      }
      this.preferenciasAplicadas = true;
    } catch (e) {
      console.warn('Falha no processamento sequencial de preferências:', e);
    } finally {
      this.preferenciasEmProcessamento = false;
      this.cdr.detectChanges();
    }
  }

  private async ativarSelecionadosNoTemaAtual(
    selecionados: SelectedLayerRef[],
  ): Promise<boolean> {
    if (!this.temaSelecionado) return false;
    const doTema = selecionados.filter(
      (s) => s.temaId === this.temaSelecionado,
    );
    if (!doTema.length) return false;
    let ativouAlguma = false;
    console.group('[Preferencias][Debug] IDs carregados no tema atual');
    this.conteudoService.grupoCamadas.forEach((g) => {
      const camIds = g.camadas.map((c) => c.id).join(', ');
      const rastIds = g.camadasRaster.map((r) => r.id).join(', ');
      const mapIds = g.mapas.map((m) => m.id).join(', ');
      console.log(
        `Grupo ${g.id} -> camadas: [${camIds}] raster: [${rastIds}] mapas: [${mapIds}]`,
      );
    });
    console.groupEnd();
    console.log(
      '[Preferencias][Debug] Procurando ativar:',
      doTema.map((d) => d.id),
    );
    for (const sel of doTema) {
      const disponivel = await this.waitUntilEntityAvailableInCurrentTema(
        sel.id,
      );
      if (!disponivel) {
        console.warn(
          '[Preferencias] Entidade ainda não disponível após timeout:',
          sel.id,
        );
      }
      const grupoPreferido = this.conteudoService.grupoCamadas.find(
        (g) => g.id === sel.grupoId,
      );
      let grupo = grupoPreferido;
      let camada = grupo?.camadas.find((c) => c.id === sel.id);
      let raster = grupo?.camadasRaster.find((r) => r.id === sel.id);
      let mapa = grupo?.mapas.find((m) => m.id === sel.id);

      if (!grupo || (!camada && !raster && !mapa)) {
        for (const g of this.conteudoService.grupoCamadas) {
          const c = g.camadas.find((x) => x.id === sel.id);
          const r = g.camadasRaster.find((x) => x.id === sel.id);
          const m = g.mapas.find((x) => x.id === sel.id);
          if (c || r || m) {
            grupo = g;
            camada = c;
            raster = r;
            mapa = m;
            break;
          }
        }
      }

      if (!grupo) {
        console.warn('[Preferencias] Grupo não encontrado para', sel);
        await this.delay(60);
        continue;
      }

      this.grupoSelecionado = grupo.id;
      grupo.visivel = true;

      if (camada) {
        console.log(
          '[Preferencias] Ativando camada vetorial',
          camada.id,
          camada.nomeCamada,
        );
        this.conteudoService.emitirAtivacaoCamadaComContexto(
          this.temaSelecionado,
          grupo.id,
          camada.id,
        );
        const layerId = `content:${camada.nomeCamada}`;
        const ok = await this.waitUntilLayerPresentOrVisible(layerId, () =>
          this.isCamadaVisivel(grupo!.id, camada!.id),
        );
        ativouAlguma = ok || ativouAlguma;
        if (!ok) {
          await this.delay(this.DELAY_VECTOR_MS);
        }
        continue;
      }
      if (raster) {
        console.log(
          '[Preferencias] Ativando camada raster',
          raster.id,
          raster.nomeCamada,
        );
        this.toggleCamadaRaster(grupo.id, raster.id, true);
        const layerId = `content:${raster.nomeCamada}_${raster.fonteDadosCamadaRaster}`;
        const ok = await this.waitUntilLayerPresentOrVisible(layerId, () =>
          this.isCamadaRasterVisivel(grupo!.id, raster!.id),
        );
        ativouAlguma = ok || ativouAlguma;
        if (!ok) {
          await this.delay(this.DELAY_RASTER_MS);
        }
        continue;
      }
      if (mapa) {
        console.log('[Preferencias] Ativando mapa', mapa.id, mapa.nomeMapa);
        this.toggleMapa(grupo.id, mapa.id, true);
        const firstVector =
          mapa.camadas && mapa.camadas.length > 0
            ? `content:${mapa.nomeMapa}_${mapa.camadas[0].nomeCamada}`
            : null;
        const firstRaster =
          mapa.camadasRaster && mapa.camadasRaster.length > 0
            ? `content:${mapa.nomeMapa}_${mapa.camadasRaster[0].nomeCamada}_${mapa.camadasRaster[0].fonteDadosCamadaRaster}`
            : null;
        const ok = await this.waitUntilLayerPresentOrVisible(
          firstVector || firstRaster || '',
          () => this.isMapaVisivel(grupo!.id, mapa!.id),
        );
        ativouAlguma = ok || ativouAlguma;
        if (!ok) {
          await this.delay(this.DELAY_MAP_MS);
        }
        continue;
      }
      console.warn(
        '[Preferencias] Nenhuma entidade encontrada para id',
        sel.id,
        'em nenhum grupo do tema',
      );
      await this.delay(this.DELAY_NOT_FOUND_MS);
    }

    if (!ativouAlguma) {
      console.warn(
        '[Preferencias] Nenhuma camada/raster/mapa foi ativada. Verifique se os IDs salvos correspondem às entidades carregadas.',
      );
    }
    return ativouAlguma;
  }

  private findEntityInCurrentTemaById(
    id: string,
  ): { grupo?: any; camada?: any; raster?: any; mapa?: any } | null {
    for (const g of this.conteudoService.grupoCamadas) {
      const c = g.camadas.find((x: any) => x.id === id);
      if (c) return { grupo: g, camada: c };
      const r = g.camadasRaster.find((x: any) => x.id === id);
      if (r) return { grupo: g, raster: r };
      const m = g.mapas.find((x: any) => x.id === id);
      if (m) return { grupo: g, mapa: m };
    }
    return null;
  }

  private async waitUntilEntityAvailableInCurrentTema(
    id: string,
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < this.WAIT_TIMEOUT_MS) {
      const found = this.findEntityInCurrentTemaById(id);
      if (found) return true;
      await this.delay(this.WAIT_STEP_MS);
    }
    return false;
  }

  private isCamadaVisivel(grupoId: string, camadaId: string): boolean {
    const grupo = this.conteudoService.grupoCamadas.find(
      (g) => g.id === grupoId,
    );
    const camada = grupo?.camadas.find((c) => c.id === camadaId);
    return !!camada?.visivel;
  }

  private isCamadaRasterVisivel(grupoId: string, camadaId: string): boolean {
    const grupo = this.conteudoService.grupoCamadas.find(
      (g) => g.id === grupoId,
    );
    const camada = grupo?.camadasRaster.find((c) => c.id === camadaId);
    return !!camada?.visivel;
  }

  private isMapaVisivel(grupoId: string, mapaId: string): boolean {
    const grupo = this.conteudoService.grupoCamadas.find(
      (g) => g.id === grupoId,
    );
    const mapa = grupo?.mapas.find((m) => m.id === mapaId);
    return !!mapa?.visivel;
  }

  private async waitUntilLayerPresentOrVisible(
    layerId: string,
    visibleFn: () => boolean,
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < this.WAIT_TIMEOUT_MS) {
      if (visibleFn()) return true;
      if (layerId && this.isLayerOnMap(layerId)) return true;
      await this.delay(this.WAIT_STEP_MS);
    }
    return false;
  }

  private ativarPorNome(
    nome: string,
    tipo: 'vector' | 'raster' | 'mapa',
  ): void {
    for (const grupo of this.conteudoService.grupoCamadas) {
      if (tipo === 'vector') {
        const camada = grupo.camadas.find((c) => c.nomeCamada === nome);
        if (camada && !camada.visivel) {
          this.toggleCamada(grupo.id, camada.id, true);
          return;
        }
      } else if (tipo === 'raster') {
        const underscoreIdx = nome.lastIndexOf('_');
        if (underscoreIdx > 0) {
          const base = nome.substring(0, underscoreIdx);
          const fonte = nome.substring(underscoreIdx + 1);
          const camadaRaster = grupo.camadasRaster.find(
            (r) => r.nomeCamada === base && r.fonteDadosCamadaRaster === fonte,
          );
          if (camadaRaster && !camadaRaster.visivel) {
            this.toggleCamadaRaster(grupo.id, camadaRaster.id, true);
            return;
          }
        }
      } else {
        const mapaItem = grupo.mapas.find((m) => m.nomeMapa === nome);
        if (mapaItem && !mapaItem.visivel) {
          this.toggleMapa(grupo.id, mapaItem.id, true);
          return;
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.camadaRemovidaSubscription) {
      this.camadaRemovidaSubscription.unsubscribe();
    }
  }

  atualizarEstadoCamadas(nomeCamada: string, visivel: boolean = false) {
    this.atualizarEstadoCamada(nomeCamada, visivel);

    const mapa = this.mapaService.getMapa();
    if (mapa) {
      const layers = mapa.getLayers().getArray();
      const layerToRemove = layers.find(
        (layer) => layer.get('id') === nomeCamada,
      );
      if (layerToRemove) {
        mapa.removeLayer(layerToRemove);
      }
    }
  }

  onTemaChange() {
    if (this.temaSelecionado) {
      this.salvarEstadoTema(this.temaSelecionado);
      //this.temaSelecionado = this.selected;
      this.loadGrupoConteudo(this.temaSelecionado).then(() => {
        this.conteudoService.grupoCamadas.forEach((grupo) => {
          grupo.camadas.forEach((camada) => {
            if (
              this.conteudoService.isCamadaRemovida(
                `content:${camada.nomeCamada}`,
              )
            ) {
              camada.visivel = false;
            }
          });
          grupo.camadasRaster.forEach((camadaRaster) => {
            if (
              this.conteudoService.isCamadaRemovida(
                `content:${camadaRaster.nomeCamada}`,
              )
            ) {
              camadaRaster.visivel = false;
            }
          });
          grupo.mapas.forEach((mapa) => {
            if (
              this.conteudoService.isCamadaRemovida(`content:${mapa.nomeMapa}`)
            ) {
              mapa.visivel = false;
            }
          });
        });

        this.cdr.detectChanges();
      });
    } else {
      this.conteudoService.grupoCamadas = [];
    }
  }

  salvarEstadoTema(temaId: string) {
    if (!this.estadoPorTema[temaId]) {
      this.estadoPorTema[temaId] = {};
    }

    this.conteudoService.grupoCamadas.forEach((grupo) => {
      if (!this.estadoPorTema[temaId][grupo.id]) {
        this.estadoPorTema[temaId][grupo.id] = {
          visivel: grupo.visivel,
          camadas: {},
          mapas: {},
        };
      }

      grupo.camadas.forEach((camada) => {
        this.estadoPorTema[temaId][grupo.id].camadas[camada.id] =
          camada.visivel;
      });

      grupo.mapas.forEach((mapa) => {
        this.estadoPorTema[temaId][grupo.id].mapas[mapa.id] = mapa.visivel;
      });
    });
  }

  restaurarEstadoTema(temaId: string) {
    if (this.estadoPorTema[temaId]) {
      this.conteudoService.grupoCamadas.forEach((grupo) => {
        const estadoGrupo = this.estadoPorTema[temaId][grupo.id];
        if (estadoGrupo) {
          let todasCamadasInvisiveis = true;
          let todosMapasInvisiveis = true;

          grupo.camadas.forEach((camada) => {
            const estadoCamada = estadoGrupo.camadas[camada.id];
            if (
              estadoCamada !== undefined &&
              !this.conteudoService.isCamadaRemovida(
                `content:${camada.nomeCamada}`,
              )
            ) {
              camada.visivel = estadoCamada;
            } else {
              camada.visivel = false;
            }

            if (camada.visivel) {
              todasCamadasInvisiveis = false;
            }
          });

          grupo.mapas.forEach((mapa) => {
            const estadoMapa = estadoGrupo.mapas[mapa.id];
            if (
              estadoMapa !== undefined &&
              !this.conteudoService.isCamadaRemovida(`content:${mapa.nomeMapa}`)
            ) {
              mapa.visivel = estadoMapa;
            } else {
              mapa.visivel = false;
            }

            if (mapa.visivel) {
              todosMapasInvisiveis = false;
            }
          });

          grupo.visivel = !(todasCamadasInvisiveis && todosMapasInvisiveis);
        }
      });

      this.cdr.detectChanges();
    }
  }

  trackByGrupoId(_: number, grupo: any): string {
    return grupo.id;
  }

  buscaAtiva = false;

  filtrarCamadasGrupos(): void {
    this.buscaAtiva = this.pesquisaTermo.trim().length >= 2;
  }

  private get _termo(): string {
    return this.pesquisaTermo.trim().toLowerCase();
  }

  filtroGrupoVisivel(grupo: any): boolean {
    const t = this._termo;
    if (t.length < 2) return true;
    if (grupo.grupoNome.toLowerCase().includes(t)) return true;
    return (
      grupo.camadas.some((c: any) =>
        c.tituloCamada.toLowerCase().includes(t),
      ) ||
      grupo.camadasRaster.some((c: any) =>
        c.tituloCamada.toLowerCase().includes(t),
      ) ||
      grupo.mapas.some((m: any) => m.tituloMapa.toLowerCase().includes(t))
    );
  }

  filtroCamadaVisivel(grupo: any, camada: any): boolean {
    const t = this._termo;
    if (t.length < 2) return true;
    if (grupo.grupoNome.toLowerCase().includes(t)) return true;
    return camada.tituloCamada.toLowerCase().includes(t);
  }

  filtroRasterVisivel(grupo: any, camada: any): boolean {
    const t = this._termo;
    if (t.length < 2) return true;
    if (grupo.grupoNome.toLowerCase().includes(t)) return true;
    return camada.tituloCamada.toLowerCase().includes(t);
  }

  filtroMapaVisivel(grupo: any, mapa: any): boolean {
    const t = this._termo;
    if (t.length < 2) return true;
    if (grupo.grupoNome.toLowerCase().includes(t)) return true;
    return mapa.tituloMapa.toLowerCase().includes(t);
  }

  sortGrupoCamada() {
    if (this.ordemAscendente === null) {
      this.ordemAscendente = true;
    } else {
      this.ordemAscendente = !this.ordemAscendente;
    }

    this.conteudoService.grupoCamadas.sort((a, b) => {
      if (this.ordemAscendente) {
        return a.grupoNome.localeCompare(b.grupoNome);
      } else {
        return b.grupoNome.localeCompare(a.grupoNome);
      }
    });
  }

  adicionarConteudoAoArray(nomeConteudo: string, tipoConteudo: string) {
    const dados = this.conteudoService.dadosAdicionais;

    // Normalizar nomeConteudo removendo o prefixo 'content:' se existir
    const nomeNormalizado = nomeConteudo.startsWith('content:')
      ? nomeConteudo.substring(8)
      : nomeConteudo;

    if (dados.some((conteudo) => conteudo.nomeConteudo === nomeNormalizado))
      return;

    const camadaOuMapa = this.conteudoService.grupoCamadas
      .flatMap((grupo) => [
        ...grupo.camadas,
        ...grupo.camadasRaster,
        ...grupo.mapas,
      ])
      .find((item) => {
        if ('fonteDadosCamadaRaster' in item && item.fonteDadosCamadaRaster) {
          return (
            `content:${item.nomeCamada}_${item.fonteDadosCamadaRaster}` ===
            nomeConteudo
          );
        } else if ('nomeCamada' in item) {
          return `content:${item.nomeCamada}` === nomeConteudo;
        } else if ('nomeMapa' in item) {
          return `content:${item.nomeMapa}` === nomeConteudo;
        }
        return false;
      });

    if (!camadaOuMapa) return;

    const novoConteudo: any = {
      id: camadaOuMapa.id,
      nomeConteudo:
        tipoConteudo === 'R' &&
        'nomeCamada' in camadaOuMapa &&
        'fonteDadosCamadaRaster' in camadaOuMapa
          ? `${camadaOuMapa.nomeCamada}_${camadaOuMapa.fonteDadosCamadaRaster}`
          : tipoConteudo === 'V' && 'nomeCamada' in camadaOuMapa
            ? `${camadaOuMapa.nomeCamada}`
            : 'nomeMapa' in camadaOuMapa
              ? `${camadaOuMapa.nomeMapa}`
              : '',
      tituloConteudo:
        'tituloCamada' in camadaOuMapa
          ? camadaOuMapa.tituloCamada
          : camadaOuMapa.tituloMapa,
      temaId: camadaOuMapa.temaId || '',
      temaConteudoNome:
        'temaCamadaNome' in camadaOuMapa
          ? camadaOuMapa.temaCamadaNome
          : camadaOuMapa.temaMapaNome || '',
      grupoConteudo:
        'grupoCamada' in camadaOuMapa
          ? camadaOuMapa.grupoCamada
          : camadaOuMapa.grupoMapa || '',
      grupoConteudoNome:
        'grupoCamadaNome' in camadaOuMapa
          ? camadaOuMapa.grupoCamadaNome
          : camadaOuMapa.grupoMapaNome || '',
      descricaoConteudo:
        'descricaoCamada' in camadaOuMapa
          ? camadaOuMapa.descricaoCamada
          : camadaOuMapa.descricaoMapa || '',
      pacoteConceitual:
        'pacoteConceitual' in camadaOuMapa ? camadaOuMapa.pacoteConceitual : '',
      pacoteConceitualNome:
        'pacoteConceitualNome' in camadaOuMapa
          ? camadaOuMapa.pacoteConceitualNome
          : '',
      nivelCompartilhamento: camadaOuMapa.nivelCompartilhamento || '',
      criadoEm: camadaOuMapa.criadoEm || '',
      updatedAt: camadaOuMapa.updatedAt || '',
      conteudoAtivo:
        'camadaAtiva' in camadaOuMapa
          ? camadaOuMapa.camadaAtiva
          : camadaOuMapa.mapaAtivo,
      fonteDadosCamadaRaster:
        'fonteDadosCamadaRaster' in camadaOuMapa
          ? camadaOuMapa.fonteDadosCamadaRaster
          : '',
      favorito: camadaOuMapa.favorito || false,
      usrCriacao: camadaOuMapa.usrCriacao || '',
      visivel: camadaOuMapa.visivel || false,
      ativo: true,
      atributos: 'atributos' in camadaOuMapa ? camadaOuMapa.atributos : null,
      popup: true,
      tableAttribute: false,
      perfil: false,
      tipoConteudo:
        tipoConteudo === 'V'
          ? 'camada'
          : tipoConteudo === 'R'
            ? 'raster'
            : 'mapa',
      camadas: 'camadas' in camadaOuMapa ? camadaOuMapa.camadas : [],
      camadasRaster:
        'camadasRaster' in camadaOuMapa ? camadaOuMapa.camadasRaster : [],
    };

    if ('tags' in camadaOuMapa) {
      novoConteudo.tags = camadaOuMapa.tags || '';
    }
    if ('linkMetadados' in camadaOuMapa) {
      novoConteudo.linkMetadados = camadaOuMapa.linkMetadados || '';
    }
    if ('nivelCompartilhamentoId' in camadaOuMapa) {
      novoConteudo.nivelCompartilhamentoId =
        camadaOuMapa.nivelCompartilhamentoId || '';
    }
    if ('fonteDadosCamada' in camadaOuMapa) {
      novoConteudo.fonteDadosCamada = camadaOuMapa.fonteDadosCamada || '';
    }
    if ('termosDeUso' in camadaOuMapa) {
      novoConteudo.termosDeUso = camadaOuMapa.termosDeUso || '';
    }
    if ('boundingBox' in camadaOuMapa) {
      novoConteudo.boundingBox = camadaOuMapa.boundingBox || '';
    }
    if ('boundingBoxMapa' in camadaOuMapa) {
      novoConteudo.boundingBox = camadaOuMapa.boundingBoxMapa || '';
    }
    if ('deletedAt' in camadaOuMapa) {
      novoConteudo.deletedAt = camadaOuMapa.deletedAt || '';
    }

    dados.push(novoConteudo);
    this.conteudoService.dadosAdicionaisFiltro.push(novoConteudo);
    queueMicrotask(() => this.conteudoService.emitirAtualizacao());
  }

  removerCamadaDoArray(nomeCamadaOuMapa: string) {
    const nomeComparacao = nomeCamadaOuMapa.startsWith('content:')
      ? nomeCamadaOuMapa.slice(8)
      : nomeCamadaOuMapa;
    const verificarCorrespondencia = (item: any) => {
      if ('nomeConteudo' in item && item.nomeConteudo) {
        return item.nomeConteudo === nomeComparacao;
      }
      if (
        'fonteDadosCamadaRaster' in item &&
        item.fonteDadosCamadaRaster &&
        'nomeCamada' in item
      ) {
        return (
          `${item.nomeCamada}_${item.fonteDadosCamadaRaster}` === nomeComparacao
        );
      }
      if ('nomeCamada' in item) {
        return item.nomeCamada === nomeComparacao;
      }
      if ('nomeMapa' in item) {
        return item.nomeMapa === nomeComparacao;
      }
      return false;
    };

    const camadaOuMapa = this.conteudoService.grupoCamadas
      .flatMap((grupo) => [
        ...grupo.camadas,
        ...grupo.camadasRaster,
        ...grupo.mapas,
      ])
      .find(verificarCorrespondencia);

    if (camadaOuMapa) {
      this.conteudoService.dadosAdicionais =
        this.conteudoService.dadosAdicionais.filter(
          (item) => !verificarCorrespondencia(item),
        );
      this.conteudoService.dadosAdicionaisFiltro =
        this.conteudoService.dadosAdicionaisFiltro.filter(
          (item) => !verificarCorrespondencia(item),
        );
      queueMicrotask(() => this.conteudoService.emitirAtualizacao());
    }
  }

  toggleGroup(grupoIndex: string, isChecked: boolean) {
    const grupo = this.conteudoService.grupoCamadas.find(
      (grupo) => grupo.id === grupoIndex,
    );

    if (!grupo) return;

    grupo.visivel = isChecked;

    if (isChecked) {
      grupo.camadas.forEach((camada) => {
        this.toggleCamada(grupoIndex, camada.id, true);
      });
      grupo.camadasRaster.forEach((camadaRaster) => {
        this.toggleCamadaRaster(grupoIndex, camadaRaster.id, true);
      });
      grupo.mapas.forEach((mapaItem) => {
        this.toggleMapa(grupoIndex, mapaItem.id, true);
      });
    } else {
      grupo.camadas.forEach((camada) => {
        this.toggleCamada(grupoIndex, camada.id, false);
      });
      grupo.camadasRaster.forEach((camadaRaster) => {
        this.toggleCamadaRaster(grupoIndex, camadaRaster.id, false);
      });
      grupo.mapas.forEach((mapaItem) => {
        this.toggleMapa(grupoIndex, mapaItem.id, false);
      });
      this.atualizarEstadoGrupoAposRemocao(grupoIndex);
    }

    if (!this.estadoPorTema[this.temaSelecionado]) {
      this.estadoPorTema[this.temaSelecionado] = {};
    }
    if (!this.estadoPorTema[this.temaSelecionado][grupoIndex]) {
      this.estadoPorTema[this.temaSelecionado][grupoIndex] = {
        visivel: false,
        camadas: {},
        mapas: {},
      };
    }
    this.estadoPorTema[this.temaSelecionado][grupoIndex].visivel = isChecked;

    this.salvarEstadoTema(this.temaSelecionado);
  }

  toggleCamada(
    grupoIndex: string,
    camadaIndex: string,
    isChecked: boolean,
    salvarEstado: boolean = true,
  ) {
    const grupo = this.conteudoService.grupoCamadas.find(
      (grupo) => grupo.id === grupoIndex,
    );

    if (!grupo) return;

    const camada = grupo?.camadas.find((camada) => camada.id === camadaIndex);
    if (!camada) return;

    const mapa = this.mapaService.getMapa();

    if (isChecked && mapa) {
      this.adicionarConteudoAoArray(`content:${camada.nomeCamada}`, 'V');
      camada.visivel = true;

      const thematicSpec = findThematicSpec(camada);
      if (thematicSpec) {
        void this.thematicLayerService.addCamada(camada, thematicSpec).then(() => {
          this.thematicLayerService.fitToActiveLayers();
        });
      } else {
        const wmsLayer = new ImageLayer({
          source: new ImageWMS({
            url: '/geoserver-proxy/content/wms',
            params: this.buildWmsParamsForCamada(camada.nomeCamada),
            ratio: 1,
            serverType: 'geoserver',
            imageLoadFunction: (image, src) => {
              const imgElement = image.getImage() as HTMLImageElement;
              imgElement.crossOrigin = 'anonymous';
              imgElement.src = src;
            },
          }),
        });
        wmsLayer.set('transition', 0);

        wmsLayer.set('id', `content:${camada.nomeCamada}`);
        wmsLayer.set('titulo', camada.tituloCamada);
        this.adicionarConteudoSeNaoExistir(wmsLayer, camadaIndex, 'V');
      }
    } else if (mapa) {
      this.atualizarEstadoCamada(`content:${camada.nomeCamada}`, false);
      this.removerCamadaDoArray(`content:${camada.nomeCamada}`);
      camada.visivel = false;
      this.thematicLayerService.removeByNomeCamada(camada.nomeCamada);

      const layers = mapa.getLayers().getArray();
      const layerToRemove = layers.find(
        (layer) => layer.get('id') === `content:${camada.nomeCamada}`,
      );
      if (layerToRemove) {
        mapa.removeLayer(layerToRemove);
      }
    }

    if (salvarEstado) {
      this.salvarEstadoTema(this.temaSelecionado);
    }

    this.atualizarEstadoGrupoAposRemocao(`content:${camada.nomeCamada}`);
  }

  private buildWmsParamsForCamada(nomeCamada: string): Record<string, any> {
    return { LAYERS: `content:${nomeCamada}` };
  }

  toggleCamadaRaster(
    grupoIndex: string,
    camadaIndex: string,
    isChecked: boolean,
    salvarEstado: boolean = true,
  ) {
    const grupo = this.conteudoService.grupoCamadas.find(
      (grupo) => grupo.id === grupoIndex,
    );

    if (!grupo) return;

    const camadaRaster = grupo?.camadasRaster.find(
      (camadaRaster) => camadaRaster.id === camadaIndex,
    );
    if (!camadaRaster) return;

    const mapa = this.mapaService.getMapa();

    const camadaId = `content:${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`;

    if (isChecked && mapa) {
      this.adicionarConteudoAoArray(camadaId, 'R');

      camadaRaster.visivel = true;

      const wmsLayer = createRasterTileLayer(
        camadaId,
        camadaRaster.tituloCamada,
      );

      this.adicionarConteudoSeNaoExistir(wmsLayer, camadaIndex, 'R');

      if (camadaRaster.boundingBox) {
        try {
          const bbox = JSON.parse(camadaRaster.boundingBox);
          const extent = [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy];
          const transformedExtent = transformExtent(
            extent,
            bbox.crs || 'EPSG:31984',
            'EPSG:3857',
          );
          mapa.getView().fit(transformedExtent, {
            size: mapa.getSize(),
            padding: [50, 50, 50, 50],
          });
        } catch (error) {
          console.error('Erro ao aplicar bounding box do raster:', error);
        }
      }
    } else if (mapa) {
      this.atualizarEstadoCamada(camadaId, false);
      this.removerCamadaDoArray(camadaId);
      camadaRaster.visivel = false;

      const layers = mapa.getLayers().getArray();
      const layerToRemove = layers.find(
        (layer) => layer.get('id') === camadaId,
      );

      if (layerToRemove) {
        mapa.removeLayer(layerToRemove);
        mapa.renderSync();
      } else {
        console.warn(`Camada ${camadaId} não encontrada para remoção.`);
      }
    }

    if (salvarEstado) {
      this.salvarEstadoTema(this.temaSelecionado);
    }

    this.atualizarEstadoGrupoAposRemocao(camadaId);
  }

  toggleMapa(
    grupoIndex: string,
    mapaIndex: string,
    isChecked: boolean,
    salvarEstado: boolean = true,
  ) {
    const grupo = this.conteudoService.grupoCamadas.find(
      (grupo) => grupo.id === grupoIndex,
    );
    if (!grupo) return;

    const mapaItem = grupo.mapas.find((mapa) => mapa.id === mapaIndex);
    if (!mapaItem) return;

    const nomeMapa = mapaItem.nomeMapa;
    const boundingBoxMapa = mapaItem.boundingBoxMapa;
    const mapa = this.mapaService.getMapa();
    const camadasVetoriais = mapaItem.camadas;
    const camadasRaster = mapaItem.camadasRaster;

    mapaItem.visivel = isChecked;

    if (isChecked && mapa) {
      this.adicionarConteudoAoArray(`content:${nomeMapa}`, 'M');

      for (const camadaVetorial of camadasVetoriais) {
        const wmsLayer = new ImageLayer({
          source: new ImageWMS({
            url: '/geoserver-proxy/content/wms',
            params: {
              LAYERS: `content:${camadaVetorial.nomeCamada}`,
              FORMAT: 'image/png',
            },
            ratio: 1,
            serverType: 'geoserver',
            imageLoadFunction: (image, src) => {
              const imgElement = image.getImage() as HTMLImageElement;
              imgElement.crossOrigin = 'anonymous';
              imgElement.src = src;
            },
          }),
        });
        wmsLayer.set('transition', 0);
        wmsLayer.set('id', `content:${nomeMapa}_${camadaVetorial.nomeCamada}`);
        wmsLayer.set(
          'titulo',
          `${mapaItem.tituloMapa}_${camadaVetorial.tituloCamada}`,
        );
        this.adicionarConteudoSeNaoExistir(wmsLayer, mapaIndex, 'M');
      }

      for (const camadaRaster of camadasRaster) {
        const layerId = `content:${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`;
        const layerTitulo = `${mapaItem.tituloMapa}_${camadaRaster.tituloCamada}_${camadaRaster.fonteDadosCamadaRaster}`;
        const wmsLayer = createRasterTileLayer(layerId, layerTitulo);
        // override the id to be map-scoped (different from the bare layer id)
        wmsLayer.set(
          'id',
          `content:${nomeMapa}_${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`,
        );
        this.adicionarConteudoSeNaoExistir(wmsLayer, mapaIndex, 'M');
      }

      if (boundingBoxMapa) {
        try {
          const bbox = JSON.parse(boundingBoxMapa);
          const extent = [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy];
          const transformedExtent = transformExtent(
            extent,
            bbox.crs || 'EPSG:31984',
            'EPSG:3857',
          );
          mapa.getView().fit(transformedExtent, {
            size: mapa.getSize(),
            padding: [50, 50, 50, 50],
          });
        } catch (error) {
          console.error('Erro ao aplicar bounding box:', error);
        }
      }
    } else if (mapa) {
      this.atualizarEstadoCamada(`content:${nomeMapa}`, false);
      this.removerCamadaDoArray(`content:${nomeMapa}`);
      mapaItem.visivel = false;

      const layers = mapa.getLayers().getArray();

      for (const camadaVetorial of camadasVetoriais) {
        const layerId = `content:${nomeMapa}_${camadaVetorial.nomeCamada}`;
        const layerToRemove = layers.find(
          (layer) => layer.get('id') === layerId,
        );
        if (layerToRemove) {
          mapa.removeLayer(layerToRemove);
        }
      }

      for (const camadaRaster of camadasRaster) {
        const layerId = `content:${nomeMapa}_${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`;
        const layerToRemove = layers.find(
          (layer) => layer.get('id') === layerId,
        );
        if (layerToRemove) {
          mapa.removeLayer(layerToRemove);
        }
      }
    }

    if (salvarEstado) {
      this.salvarEstadoTema(this.temaSelecionado);
    }

    this.atualizarEstadoGrupoAposRemocao(`content:${mapaItem.nomeMapa}`);
  }

  private adicionarConteudoSeNaoExistir = (
    wmsLayer: ImageLayer<ImageWMS> | TileLayer<TileWMS>,
    camadaId: string,
    conteudo: string,
  ) => {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return;
    const layers = mapa.getLayers().getArray();
    const conteudoExistente = layers.find(
      (layer) => layer.get('id') === wmsLayer.get('id'),
    );

    if (!conteudoExistente) {
      mapa.getLayers().push(wmsLayer);

      this.recaptchaV3Service
        .execute('addDados')
        .subscribe((captchaToken: string) => {
          if (conteudo === 'M') {
            this.createLogMapaService
              .createLogMapa({ id: camadaId, captchaToken })
              .subscribe();
          } else if (conteudo === 'V') {
            this.createLogCamadaService
              .createLogCamada({ id: camadaId, captchaToken })
              .subscribe();
          } else {
            this.createLogCamadaService
              .createLogCamadaRaster({ id: camadaId, captchaToken })
              .subscribe();
          }
        });
    }
  };

  getThumbnail(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): string {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
    );

    // Sempre tentar carregar se não estiver no cache
    if (!this.thumbnailUrls.has(imageUrl) && !this.loading.get(imageUrl)) {
      this.loading.set(imageUrl, true);
      this.thumbnailCacheService.getThumbnail(imageUrl).subscribe(
        (cachedUrl) => {
          this.thumbnailUrls.set(imageUrl, cachedUrl);
          this.loading.set(imageUrl, false);
          this.cdr.detectChanges();
        },
        (error) => {
          console.error('Error loading thumbnail:', error);
          this.loading.set(imageUrl, false);
          this.thumbnailErrors.set(imageUrl, true);
          this.cdr.detectChanges();
        },
      );
    }

    return this.thumbnailUrls.get(imageUrl) || '';
  }

  downloadSHP(camada: any): string {
    return `${this.urlWms}/content/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=content:${camada.nomeCamada}&outputFormat=SHAPE-ZIP`;
  }

  atualizarEstadoCamada(nomeConteudo: string, ativo: boolean) {
    const grupo = this.conteudoService.grupoCamadas.find(
      (g) =>
        g.camadas.some((c) => `content:${c.nomeCamada}` === nomeConteudo) ||
        g.camadasRaster.some(
          (c) =>
            `content:${c.nomeCamada}_${c.fonteDadosCamadaRaster}` ===
            nomeConteudo,
        ) ||
        g.mapas.some((m) => `content:${m.nomeMapa}` === nomeConteudo),
    );

    if (grupo) {
      const camada = grupo.camadas.find(
        (c) => `content:${c.nomeCamada}` === nomeConteudo,
      );
      const camadaRaster = grupo.camadasRaster.find(
        (c) =>
          `content:${c.nomeCamada}_${c.fonteDadosCamadaRaster}` ===
          nomeConteudo,
      );
      const mapa = grupo.mapas.find(
        (m) => `content:${m.nomeMapa}` === nomeConteudo,
      );

      if (camada) {
        camada.visivel = ativo;
      } else if (mapa) {
        mapa.visivel = ativo;
      } else if (camadaRaster) {
        camadaRaster.visivel = ativo;
      }

      const mapaOL = this.mapaService.getMapa();
      if (mapaOL && !ativo) {
        const layers = mapaOL.getLayers().getArray();
        const layerToRemove = layers.find(
          (layer) => layer.get('id') === nomeConteudo,
        );
        if (layerToRemove) {
          mapaOL.removeLayer(layerToRemove);
        }
      }
    }

    this.atualizarEstadoGrupoAposRemocao(nomeConteudo);
    this.cdr.detectChanges();
  }

  atualizarEstadoGrupoAposRemocao(nomeCamadaOuMapa: string) {
    const grupo = this.conteudoService.grupoCamadas.find(
      (g) =>
        g.camadas.some((c) => `content:${c.nomeCamada}` === nomeCamadaOuMapa) ||
        g.camadasRaster.some(
          (c) =>
            `content:${c.nomeCamada}_${c.fonteDadosCamadaRaster}` ===
            nomeCamadaOuMapa,
        ) ||
        g.mapas.some((m) => `content:${m.nomeMapa}` === nomeCamadaOuMapa),
    );

    if (grupo) {
      const todasCamadasDesabilitadas = grupo.camadas.every((c) => !c.visivel);
      const todasCamadasRasterDesabilitadas = grupo.camadasRaster.every(
        (c) => !c.visivel,
      );
      const todosMapasDesabilitados = grupo.mapas.every((m) => !m.visivel);

      grupo.visivel = !(
        todasCamadasDesabilitadas &&
        todasCamadasRasterDesabilitadas &&
        todosMapasDesabilitados
      );

      if (
        this.estadoPorTema[this.temaSelecionado] &&
        this.estadoPorTema[this.temaSelecionado][grupo.id]
      ) {
        this.estadoPorTema[this.temaSelecionado][grupo.id].visivel =
          grupo.visivel;
      }

      this.salvarEstadoTema(this.temaSelecionado);

      this.cdr.detectChanges();
    }
  }

  // Performance optimization methods for thumbnail lazy loading

  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) {
      // Fallback: load thumbnails immediately for older browsers
      console.warn(
        'Intersection Observer not supported in adicionar-dados component.',
      );
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const itemId = element.getAttribute('data-item-id');
            if (itemId && !this.loadedItems.has(itemId)) {
              this.loadedItems.add(itemId);
              this.loadThumbnailForItem(itemId);
              this.intersectionObserver.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px', // Smaller margin for sidebar
        threshold: 0.1,
      },
    );
  }

  private loadThumbnailForItem(itemId: string): void {
    try {
      // Parse itemId to get layer info
      const [layerName, boundingBox, fonteDados, contentType] =
        itemId.split('|');

      if (layerName) {
        const imageUrl = this.generateThumbnailUrl(
          layerName,
          boundingBox,
          fonteDados,
          (contentType as 'camada' | 'raster' | 'mapa' | undefined) ?? 'camada',
        );
        if (imageUrl) {
          this.queueThumbnailLoad(imageUrl);
        }
      }
    } catch (error) {
      console.warn(`Error in loadThumbnailForItem for ${itemId}:`, error);
    }
  }

  private getThumbnailDimensions(boundingBox?: string): {
    bbox: string;
    width: number;
    height: number;
  } {
    let bbox = '315476.5,7691027.0,390465.375,7895713.0';
    const width = 800;
    const height = 600;

    if (boundingBox && boundingBox !== 'undefined') {
      try {
        const bboxObj = JSON.parse(boundingBox);
        let minx = Number(bboxObj.minx);
        let miny = Number(bboxObj.miny);
        let maxx = Number(bboxObj.maxx);
        let maxy = Number(bboxObj.maxy);

        const bboxWidth = maxx - minx;
        const bboxHeight = maxy - miny;

        if (bboxWidth > 0 && bboxHeight > 0) {
          const targetAspectRatio = width / height;
          const bboxAspectRatio = bboxWidth / bboxHeight;

          if (bboxAspectRatio > targetAspectRatio) {
            const adjustedHeight = bboxWidth / targetAspectRatio;
            const padding = (adjustedHeight - bboxHeight) / 2;
            miny -= padding;
            maxy += padding;
          } else {
            const adjustedWidth = bboxHeight * targetAspectRatio;
            const padding = (adjustedWidth - bboxWidth) / 2;
            minx -= padding;
            maxx += padding;
          }

          bbox = `${minx},${miny},${maxx},${maxy}`;
        }
      } catch (error) {
        console.error('Failed to parse bounding box:', error);
      }
    }

    return { bbox, width, height };
  }

  private generateThumbnailUrl(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): string {
    let fullLayerName = `content:${layerName}`;
    if (fonteDadosCamadaRaster && fonteDadosCamadaRaster !== 'undefined') {
      fullLayerName += `_${fonteDadosCamadaRaster}`;
    }

    if (contentType === 'raster') {
      return `/geoserver-proxy/content/wms/reflect?layers=${encodeURIComponent(fullLayerName)}&format=image/png&width=800&height=600`;
    }

    const { bbox, width, height } = this.getThumbnailDimensions(boundingBox);
    return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31984&styles=&format=image/png&transparent=true`;
  }

  private queueThumbnailLoad(imageUrl: string): void {
    try {
      if (this.thumbnailUrls.has(imageUrl) || this.loading.get(imageUrl)) {
        return; // Already loaded or loading
      }

      this.loading.set(imageUrl, true);
      this.loadingQueue.push(imageUrl);
      this.processQueue();
    } catch (error) {
      console.warn('Error queueing thumbnail load:', error);
    }
  }

  private processQueue(): void {
    try {
      while (
        this.loadingQueue.length > 0 &&
        this.activeRequests < this.MAX_CONCURRENT_REQUESTS
      ) {
        const nextUrl = this.loadingQueue.shift();
        if (nextUrl) {
          this.startThumbnailLoad(nextUrl);
        }
      }
    } catch (error) {
      console.warn('Error processing thumbnail queue:', error);
    }
  }

  private startThumbnailLoad(imageUrl: string): void {
    this.activeRequests++;

    this.thumbnailCacheService.getThumbnail(imageUrl).subscribe({
      next: (cachedUrl: string) => {
        this.thumbnailUrls.set(imageUrl, cachedUrl);
        this.loading.set(imageUrl, false);
        this.activeRequests--;
        this.cdr.detectChanges();
        this.processQueue();
      },
      error: (error: any) => {
        console.warn(
          'Failed to load thumbnail in adicionar-dados, continuing with next:',
          error,
        );
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
        this.activeRequests--;
        this.processQueue();
      },
    });
  }

  // Optimized thumbnail getter
  getThumbnailOptimized(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): string {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
    );
    return this.thumbnailUrls.get(imageUrl) || '';
  }

  // Check if thumbnail is loading
  isThumbnailLoading(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): boolean {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
    );
    return this.loading.get(imageUrl) || false;
  }

  // Check if thumbnail has error
  hasThumbnailError(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): boolean {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
    );
    return this.thumbnailErrors.get(imageUrl) || false;
  }

  // Generate unique item ID for intersection observer
  getItemId(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): string {
    return `${layerName}|${boundingBox || ''}|${fonteDadosCamadaRaster || ''}|${contentType}`;
  }

  // Get thumbnail state for template
  getThumbnailState(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): 'loading' | 'loaded' | 'error' | 'placeholder' {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
    );

    if (
      this.thumbnailErrors.has(imageUrl) &&
      this.thumbnailErrors.get(imageUrl)
    ) {
      return 'error';
    }
    if (this.loading.has(imageUrl) && this.loading.get(imageUrl)) {
      return 'loading';
    }
    if (this.thumbnailUrls.has(imageUrl)) {
      return 'loaded';
    }
    return 'placeholder';
  }

  // Get thumbnail URL for template
  getThumbnailUrl(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): string {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
    );
    return this.thumbnailUrls.get(imageUrl) || '';
  }

  // Reload thumbnail with itemId
  reloadThumbnail(
    itemId: string,
    layerName?: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: 'camada' | 'raster' | 'mapa' = 'camada',
  ): void {
    if (layerName) {
      // Direct method call
      const imageUrl = this.generateThumbnailUrl(
        layerName,
        boundingBox,
        fonteDadosCamadaRaster,
        contentType,
      );
      this.loading.set(imageUrl, true);
      this.thumbnailErrors.delete(imageUrl);

      this.thumbnailCacheService.reloadThumbnail(imageUrl).subscribe({
        next: (cachedUrl: string) => {
          this.thumbnailUrls.set(imageUrl, cachedUrl);
          this.loading.set(imageUrl, false);
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('Error reloading thumbnail in adicionar-dados:', error);
          this.loading.set(imageUrl, false);
          this.thumbnailErrors.set(imageUrl, true);
        },
      });
    }
  }

  // Observer thumbnail container
  observeThumbnail(element: HTMLElement, itemId: string): void {
    if (this.intersectionObserver && element) {
      element.setAttribute('data-item-id', itemId);
      this.intersectionObserver.observe(element);
    }
  }
}
