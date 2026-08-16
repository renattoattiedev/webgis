import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { MapaService } from 'src/app/services/mapa.service';
import {
  BasemapService,
  BasemapOption,
} from 'src/app/services/basemap.service';
import { Map } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import { getPointResolution } from 'ol/proj';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';

export interface CroquiVistoriaConfig {
  imprimirLegenda: boolean;
  auxSelecionadasIds: string[];
  escalaSelecionada?: number;
  basemapSelecionado?: string;
}

@Component({
  selector: 'app-config-imprimir-croqui-vistoria-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    FormsModule,
    DragDropModule,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#2e7d32',
      },
    },
  ],
  templateUrl: './config-imprimir-croqui-vistoria-dialog.component.html',
  styleUrl: './config-imprimir-croqui-vistoria-dialog.component.scss',
})
export class ConfigImprimirCroquiVistoriaDialogComponent implements OnInit {
  auxCamadas: Array<{
    tema: string | null;
    grupo: string | null;
    camada: string | null;
    camadaNome?: string | null;
  }> = [];
  urlWms: string | undefined;
  escalaOptions: number[] = [
    500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 750000,
    900000, 1000000,
  ];
  escalaSelecionada: number | null = null;
  basemapOptions: BasemapOption[] = [];
  basemapSelecionado: string | null = null;
  mostrarCamposSS: boolean = false;

  config: CroquiVistoriaConfig = {
    imprimirLegenda: true,
    auxSelecionadasIds: [],
  };

  constructor(
    private conteudoService: ConteudoService,
    private fetchConfigService: FetchConfigsService,
    private mapaService: MapaService,
    private basemapService: BasemapService,
    private dialogRef: MatDialogRef<ConfigImprimirCroquiVistoriaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    const cfg = data?.componente?.configuracao || {};
    const arr = Array.isArray(cfg.camadas) ? cfg.camadas : [];
    this.auxCamadas = arr.filter((c: any) => c && (c.camada || c.camadaNome));

    const preSelecionadas: string[] = data?.selecionadas || [];
    this.config.auxSelecionadasIds = [...preSelecionadas];

    const preConfig: Partial<CroquiVistoriaConfig> = data?.config || {};
    this.config.imprimirLegenda =
      preConfig.imprimirLegenda ?? this.config.imprimirLegenda;

    // Load WMS base URL for thumbnails
    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const urlWmsConfig = configs.find(
        (config) => config.key === 'GEOSERVER_URL',
      );
      this.urlWms =
        urlWmsConfig && typeof urlWmsConfig.value === 'string'
          ? urlWmsConfig.value
          : undefined;
    });

    // Inicializa escala selecionada pela escala atual do mapa (aproximação ao valor mais próximo)
    const currentScale = this.mapaService.getCurrentScale();
    this.escalaSelecionada = this.getNearestScale(currentScale);
    // Também refletir no config retornado
    this.config.escalaSelecionada = this.escalaSelecionada ?? undefined;

    // Basemap atual do mapa
    this.basemapSelecionado = this.getCurrentBasemapUrl();

    // Mostrar/ocultar campos de SS conforme registro selecionado
    this.mostrarCamposSS = !!data?.mostrarCamposSS;
  }

  ngOnInit(): void {
    // Carregar basemaps do BasemapService
    this.basemapService.getBasemapsObservable().subscribe((basemaps) => {
      this.basemapOptions = basemaps;
    });
  }

  toggleAux(
    camadaId: string | null,
    aux: { tema: string | null; grupo: string | null; camada: string | null },
  ): void {
    if (!camadaId) return;
    const idx = this.config.auxSelecionadasIds.indexOf(camadaId);
    if (idx >= 0) {
      this.config.auxSelecionadasIds.splice(idx, 1);
    } else {
      this.config.auxSelecionadasIds.push(camadaId);
    }
  }

  aplicarNoMapa(): void {
    for (const aux of this.auxCamadas) {
      if (!aux.camada) continue;
      const selecionada = this.config.auxSelecionadasIds.includes(aux.camada);
      if (aux.tema && aux.grupo && aux.camada) {
        this.conteudoService.emitirToggleCamadaComContexto(
          aux.tema,
          aux.grupo,
          aux.camada,
          selecionada,
        );
      }
    }
    // Aplicar escala selecionada no mapa, se definida
    if (this.escalaSelecionada && isFinite(this.escalaSelecionada)) {
      this.applyScaleToMap(this.escalaSelecionada);
      this.config.escalaSelecionada = this.escalaSelecionada;
    }
    // Aplicar basemap selecionado
    if (this.basemapSelecionado) {
      this.applyBasemapToMap(this.basemapSelecionado);
      this.config['basemapSelecionado'] = this.basemapSelecionado;
    }
    this.dialogRef.close(this.config);
  }

  getAuxThumbnail(aux: {
    camada: string | null;
    camadaNome?: string | null;
  }): string {
    if (!this.urlWms) return '';
    const name = (aux.camadaNome || aux.camada || '').toString();
    if (!name) return '';
    const fullLayerName = `content:${name}`;
    const bbox = '315476.5,7691027.0,390465.375,7895713.0';
    const width = 40;
    const height = 40;
    const imageUrl = `${this.urlWms}/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31984&styles=&format=image/png`;
    return imageUrl;
  }

  private getNearestScale(current: number | null): number | null {
    if (!current || !isFinite(current)) {
      return this.escalaOptions[0] || null;
    }
    let nearest = this.escalaOptions[0];
    let minDiff = Math.abs(current - nearest);
    for (const s of this.escalaOptions) {
      const d = Math.abs(current - s);
      if (d < minDiff) {
        minDiff = d;
        nearest = s;
      }
    }
    return nearest;
  }

  private applyScaleToMap(targetScale: number): void {
    const map: Map | null = this.mapaService.getMapa();
    if (!map) return;
    const view = map.getView();
    const center = view.getCenter();
    const projection = view.getProjection();
    if (!center) return;
    const DPI = 96;
    const INCHES_PER_METER = 39.37008;
    try {
      let targetResolution = targetScale / (DPI * INCHES_PER_METER);
      if (projection.getUnits() === 'degrees') {
        const currentPointResolution = getPointResolution(
          projection,
          1,
          center,
        );
        targetResolution = targetResolution / currentPointResolution;
      }
      view.animate({ resolution: targetResolution, duration: 250 });
      this.mapaService.updateScale(targetScale);
    } catch (e) {
      this.mapaService.updateScale(targetScale);
    }
  }

  fechar(): void {
    this.dialogRef.close();
  }

  private getCurrentBasemapUrl(): string | null {
    const map: Map | null = this.mapaService.getMapa();
    if (!map) return null;
    const baseLayer = map.getLayers().item(0) as TileLayer<XYZ> | null;
    if (!baseLayer) return null;
    const source: any = baseLayer.getSource();
    if (!source) return null;
    // Try known methods
    if (typeof source.getUrls === 'function') {
      const urls = source.getUrls();
      if (Array.isArray(urls) && urls.length > 0) return urls[0];
    }
    if (typeof source.getUrl === 'function') {
      const url = source.getUrl();
      if (typeof url === 'string') return url;
    }
    // Fallback to checking internal options
    const url = source.url || source.urls?.[0];
    if (typeof url === 'string') return url;
    return this.basemapOptions[0].source;
  }

  private applyBasemapToMap(urlTemplate: string): void {
    const map: Map | null = this.mapaService.getMapa();
    if (!map) return;

    // Encontrar o basemap correspondente para obter tipo e wmsParams
    const selectedBasemap = this.basemapOptions.find(
      (b) => b.source === urlTemplate,
    );

    // Criar source apropriado (WMS ou XYZ)
    const source =
      selectedBasemap?.type === 'wms'
        ? new TileWMS({
            url: selectedBasemap.source,
            params: selectedBasemap.wmsParams ?? {},
            crossOrigin: 'anonymous',
          })
        : new XYZ({
            url: urlTemplate,
            crossOrigin: 'anonymous',
            maxZoom: 19,
          });

    const newBase = new TileLayer({
      source,
      preload: 1,
    });
    newBase.set('transition', 0);
    map.getLayers().setAt(0, newBase);
    this.mapaService.updateBasemap(urlTemplate);
  }
}
