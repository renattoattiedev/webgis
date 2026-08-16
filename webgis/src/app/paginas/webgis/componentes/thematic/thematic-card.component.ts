import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import Overlay from 'ol/Overlay';
import { Feature } from 'ol';
import type { Map as OlMap } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { WindowBehavior } from 'src/app/shared/window/window-behavior';
import { Subscription } from 'rxjs';
import { FetchContentService } from 'src/app/services/api/fetch.content.service';
import { MapaService } from 'src/app/services/mapa.service';
import { Camadas } from 'src/app/models/camadas.model';
import {
  buildLegendModel,
  formatThematicValue,
  getFeatureProperty,
  parseNumeric,
  resolveDomain,
} from './classifier/thematic-classifier';
import { ThematicLayerService } from './layer/thematic-layer.service';
import { ThematicLegendComponent } from './legend/thematic-legend.component';
import {
  createHighlightStyle,
  THEMATIC_LAYER_KEY,
  THEMATIC_TITLE_KEY,
} from './style/thematic-ol-style';
import { THEMATIC_CATALOG, findThematicSpec, resolveSpecForCamada } from './thematic-specs';
import {
  ThematicCatalogEntry,
  ThematicLegendModel,
  ThematicStyleSpec,
} from './thematic-style.types';

interface ThematicLayerItem {
  camada: Camadas;
  spec: ThematicStyleSpec;
  visible: boolean;
  loading: boolean;
  error: string | null;
  featureCount: number | null;
}

export interface ThematicHoverInfo {
  titulo: string;
  nome: string | null;
  valorLabel: string;
}

@Component({
  selector: 'app-thematic-card',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ThematicLegendComponent,
  ],
  templateUrl: './thematic-card.component.html',
  styleUrl: './thematic-card.component.scss',
})
export class ThematicCardComponent
  extends WindowBehavior
  implements AfterViewInit, OnDestroy
{
  @ViewChild('draggableWindow') override draggableWindow!: ElementRef<HTMLElement>;
  @ViewChild('hoverTooltip') hoverTooltipEl!: ElementRef<HTMLElement>;
  @Output() fechado = new EventEmitter<void>();

  override defaultSize = { width: 360, height: 520 };
  override minimizedSize = { width: 220, height: 42 };

  readonly catalog = THEMATIC_CATALOG;
  entry: ThematicCatalogEntry = THEMATIC_CATALOG[0];
  layers: ThematicLayerItem[] = [];
  carregandoLista = false;
  hoverInfo: ThematicHoverInfo | null = null;

  private hoverOverlay!: Overlay;
  private highlightLayer!: VectorLayer<VectorSource>;
  private highlightSource = new VectorSource();
  private pointerMoveListener: ((event: any) => void) | null = null;
  private mapSub?: Subscription;

  constructor(
    protected override cdr: ChangeDetectorRef,
    private fetchContentService: FetchContentService,
    private thematicLayerService: ThematicLayerService,
    private mapaService: MapaService,
    private snackBar: MatSnackBar,
  ) {
    super(cdr);
  }

  get spec(): ThematicStyleSpec {
    return this.entry.spec;
  }

  get legendasVisiveis(): ThematicLegendModel[] {
    return this.layers
      .filter((item) => item.visible)
      .map((item) =>
        buildLegendModel(
          item.spec,
          resolveDomain(item.spec),
          item.camada.tituloCamada,
        ),
      );
  }

  get algumaVisivel(): boolean {
    return this.layers.some((item) => item.visible);
  }

  ngAfterViewInit(): void {
    this.positionTopRight();
    this.initWindowBehaviorLifecycle();
    this.mapSub = this.mapaService.getMapaObservable().subscribe(() => {
      if (!this.hoverOverlay) {
        this.inicializarMapa();
      }
      if (!this.layers.length && !this.carregandoLista) {
        this.carregarCamadasDoGrupo();
      }
    });
  }

  override ngOnDestroy(): void {
    this.mapSub?.unsubscribe();
    this.desligarHover();
    this.thematicLayerService.clearAll();
    const map = this.mapaService.getMapa();
    if (map) {
      if (this.hoverOverlay) map.removeOverlay(this.hoverOverlay);
      if (this.highlightLayer) map.removeLayer(this.highlightLayer);
    }
    super.ngOnDestroy();
  }

  fechar(): void {
    this.fechado.emit();
  }

  async toggleLayer(item: ThematicLayerItem): Promise<void> {
    if (item.loading) return;
    if (item.visible) {
      this.thematicLayerService.removeCamada(
        item.spec.id,
        item.camada.nomeCamada,
      );
      item.visible = false;
      this.limparHover();
      this.cdr.detectChanges();
      return;
    }

    item.loading = true;
    item.error = null;
    this.cdr.detectChanges();
    try {
      const handle = await this.thematicLayerService.addCamada(
        item.camada,
        item.spec,
      );
      item.visible = true;
      item.featureCount = handle.featureCount;
      if (handle.featureCount === 0) {
        this.snackBar.open(
          `Nenhuma geometria encontrada em "${item.camada.tituloCamada}".`,
          'OK',
          { duration: 3500 },
        );
      }
    } catch {
      item.error = 'Falha ao carregar';
      this.snackBar.open(
        `Não foi possível carregar "${item.camada.tituloCamada}".`,
        'OK',
        { duration: 3500 },
      );
    } finally {
      item.loading = false;
      this.cdr.detectChanges();
    }
  }

  async carregarTodas(): Promise<void> {
    const pendentes = this.layers.filter((item) => !item.visible && !item.loading);
    for (const item of pendentes) {
      await this.toggleLayer(item);
    }
    this.thematicLayerService.fitToActiveLayers();
  }

  limparTodas(): void {
    for (const item of this.layers) {
      this.thematicLayerService.removeCamada(
        item.spec.id,
        item.camada.nomeCamada,
      );
      item.visible = false;
    }
    this.limparHover();
    this.cdr.detectChanges();
  }

  enquadrar(): void {
    this.thematicLayerService.fitToActiveLayers();
  }

  private carregarCamadasDoGrupo(): void {
    this.carregandoLista = true;
    this.fetchContentService.getContent(this.entry.source.groupId).subscribe({
      next: (res) => {
        this.layers = this.extrairCamadas(res)
          .filter((camada) => this.camadaCompativel(camada))
          .map((camada) => ({
            camada,
            spec: resolveSpecForCamada(this.entry, camada),
            visible: false,
            loading: false,
            error: null,
            featureCount: null,
          }));
        this.carregandoLista = false;
        this.cdr.detectChanges();
        void this.carregarTodas();
      },
      error: () => {
        this.carregandoLista = false;
        this.snackBar.open(
          'Não foi possível buscar as camadas do grupo.',
          'OK',
          { duration: 4000 },
        );
        this.cdr.detectChanges();
      },
    });
  }

  private extrairCamadas(res: {
    camadas?: Camadas[];
    mapas?: { camadas?: Camadas[] }[];
  }): Camadas[] {
    const diretas = res.camadas ?? [];
    const deMapas = (res.mapas ?? []).flatMap((mapa) => mapa.camadas ?? []);
    const byId = new Map<string, Camadas>();
    for (const camada of [...diretas, ...deMapas]) {
      if (camada?.id || camada?.nomeCamada) {
        byId.set(camada.id || camada.nomeCamada, camada);
      }
    }
    return [...byId.values()];
  }

  private camadaCompativel(camada: Camadas): boolean {
    if (findThematicSpec(camada)) return true;
    const atributos = camada.atributos;
    if (!atributos?.length) return true;
    const field = this.spec.valueField.toLowerCase();
    return atributos.some(
      (attr) => attr.nomeAtributo?.toLowerCase() === field,
    );
  }

  private inicializarMapa(): void {
    const map = this.mapaService.getMapa();
    if (!map || !this.hoverTooltipEl) return;

    this.hoverOverlay = new Overlay({
      element: this.hoverTooltipEl.nativeElement,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -12],
    });
    map.addOverlay(this.hoverOverlay);

    this.highlightLayer = new VectorLayer({
      source: this.highlightSource,
      style: createHighlightStyle(),
      zIndex: 46,
    });
    this.highlightLayer.set(THEMATIC_LAYER_KEY, true);
    map.addLayer(this.highlightLayer);

    this.pointerMoveListener = (event: any) => this.onPointerMove(map, event);
    map.on('pointermove', this.pointerMoveListener);
  }

  private desligarHover(): void {
    const map = this.mapaService.getMapa();
    if (map && this.pointerMoveListener) {
      map.un('pointermove', this.pointerMoveListener);
    }
    this.pointerMoveListener = null;
  }

  private onPointerMove(map: OlMap, event: any): void {
    if (event.dragging) return;
    const pixel = event.pixel as [number, number];
    const hit = map.forEachFeatureAtPixel(
      pixel,
      (feature, layer) => ({ feature, layer }),
      {
        layerFilter: (layer) =>
          layer !== this.highlightLayer &&
          this.thematicLayerService.isThematicLayer(layer),
        hitTolerance: 3,
      },
    );

    if (!hit) {
      this.limparHover();
      map.getTargetElement().style.cursor = '';
      return;
    }

    map.getTargetElement().style.cursor = 'pointer';
    const feature = hit.feature as Feature;
    const titulo =
      (hit.layer.get(THEMATIC_TITLE_KEY) as string) ||
      'Camada temática';
    const item = this.layers.find(
      (layer) => layer.camada.tituloCamada === titulo,
    );
    const spec = item?.spec ?? this.spec;
    const nome = this.resolverNome(feature, spec);
    const valor = parseNumeric(getFeatureProperty(feature, spec.valueField));

    this.hoverInfo = {
      titulo,
      nome,
      valorLabel: formatThematicValue(valor, spec),
    };

    this.highlightSource.clear();
    const geom = feature.getGeometry();
    if (geom) {
      this.highlightSource.addFeature(new Feature(geom.clone()));
    }
    this.hoverOverlay.setPosition(event.coordinate);
    this.cdr.detectChanges();
  }

  private resolverNome(feature: Feature, spec: ThematicStyleSpec): string | null {
    for (const field of spec.labelFields ?? []) {
      const value = getFeatureProperty(feature, field);
      if (value != null && String(value).trim() !== '') {
        return String(value);
      }
    }
    return null;
  }

  private limparHover(): void {
    if (!this.hoverInfo && this.highlightSource.getFeatures().length === 0) {
      return;
    }
    this.hoverInfo = null;
    this.highlightSource.clear();
    this.hoverOverlay?.setPosition(undefined);
    this.cdr.detectChanges();
  }
}
