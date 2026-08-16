import {
  Component,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

import { Map } from 'ol';
import { Draw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Stroke, Fill, Circle as CircleStyle } from 'ol/style';
import { Geometry } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import { intersects } from 'ol/extent';
import { transform } from 'ol/proj';
import { MapaService } from 'src/app/services/mapa.service';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { WindowBehavior } from 'src/app/shared/window/window-behavior';
import { Subject } from 'rxjs';

interface SelectedFeature {
  id: string;
  properties: any;
  geometry: any;
  camada: string;
  layerName: string;
}

interface LayerSelection {
  [camadaId: string]: {
    nome: string;
    features: SelectedFeature[];
    count: number;
  };
}

@Component({
  selector: 'app-spatial-search',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCardModule,
    MatListModule,
    MatDividerModule,
  ],
  templateUrl: './spatial-search.component.html',
  styleUrl: './spatial-search.component.scss',
})
export class SpatialSearchComponent
  extends WindowBehavior
  implements AfterViewInit, OnDestroy
{
  @ViewChild('draggableWindow')
  override draggableWindow!: ElementRef<HTMLElement>;
  @Output() fechado = new EventEmitter<void>();

  drawingMode: 'polygon' | 'point' | 'box' | 'freehand' | null = null;
  drawInteraction: Draw | null = null;

  drawSource: VectorSource = new VectorSource();
  drawLayer: VectorLayer<VectorSource> = new VectorLayer({
    source: this.drawSource,
    style: this.getDrawStyle(),
    zIndex: 1000,
  } as any);

  selectionSource: VectorSource = new VectorSource();
  selectionLayer: VectorLayer<VectorSource> = new VectorLayer({
    source: this.selectionSource,
    // Substituído por style function dinâmica para efeito moderno de highlight
    style: (feature: any) => this.getDynamicHighlightStyles(feature),
    zIndex: 999,
  } as any);

  selectedFeatures: { [key: string]: SelectedFeature } = {};
  layerSelections: LayerSelection = {};
  layerSelectionsArray: Array<[string, LayerSelection[string]]> = [];

  isLoading = false;
  totalSelected = 0;
  showResults = false;
  bufferDistance = 30;
  private lastDrawGeometry: Geometry | null = null;
  private bufferUpdateTimer: any = null;

  map: Map | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private mapaService: MapaService,
    private conteudoService: ConteudoService,
    protected override cdr: ChangeDetectorRef,
  ) {
    super(cdr);
    this.defaultSize = { width: 450, height: 600 };
    this.minimizedSize = { width: 360, height: 42 };
  }

  ngAfterViewInit(): void {
    this.map = this.mapaService.getMapa();
    if (this.map) {
      this.map.addLayer(this.drawLayer);
      this.map.addLayer(this.selectionLayer);
      // Desabilita identify globalmente enquanto a janela de pesquisa espacial estiver aberta
      this.mapaService.setIdentifyEnabled(false);
      this.positionTopRight();
      this.initWindowBehaviorLifecycle?.();
      this.cdr.detectChanges();
    }
  }

  /** Ciclo de destruição: remove camadas de desenho/destaque e re-habilita identify */
  override ngOnDestroy(): void {
    if (this.map) {
      this.map.removeLayer(this.drawLayer);
      this.map.removeLayer(this.selectionLayer);
      // Remover interação de desenho, se ativa
      if (this.drawInteraction) {
        this.map.removeInteraction(this.drawInteraction);
        this.drawInteraction = null;
      }
    }
    if (this.bufferUpdateTimer) {
      clearTimeout(this.bufferUpdateTimer);
      this.bufferUpdateTimer = null;
    }
    // Resetar modo e cursor
    this.drawingMode = null;
    this.updateCursor();
    this.mapaService.setIdentifyEnabled(true);
    super.ngOnDestroy();
  }

  fechar(): void {
    // Garante que ferramentas e cursor sejam desabilitados ao fechar
    this.clearSelection();
    this.mapaService.setIdentifyEnabled(true);
    this.fechado.emit();
  }

  activatePolygonDraw(): void {
    this.setDrawMode('polygon', 'Polygon');
  }

  activatePointDraw(): void {
    this.setDrawMode('point', 'Point');
  }

  activateBoxDraw(): void {
    this.setDrawMode('box', 'Circle');
  }

  // Novo modo: desenho à mão livre (freehand)
  activateFreehandDraw(): void {
    this.setDrawMode('freehand', 'Polygon');
  }

  private setDrawMode(
    mode: 'polygon' | 'point' | 'box' | 'freehand',
    geomType: string,
  ): void {
    if (this.drawInteraction && this.map) {
      this.map.removeInteraction(this.drawInteraction);
    }

    if (this.drawingMode === mode) {
      this.drawingMode = null;
      this.updateCursor();
      return;
    }

    this.drawingMode = mode;
    const options: any = {
      source: this.drawSource,
      type: geomType as any,
      style: this.getDrawStyle(),
    };
    // Para seleção retangular, usar geometryFunction para retornar Polygon
    if (mode === 'box') {
      options.geometryFunction = createBox();
    }
    // Para desenho à mão livre, ativar freehand
    if (mode === 'freehand') {
      options.freehand = true;
    }
    this.drawInteraction = new Draw(options);

    if (this.map) {
      this.map.addInteraction(this.drawInteraction);
      this.drawInteraction.on('drawend', (event: any) => {
        this.onDrawEnd(event);
      });
    }
    this.updateCursor();
  }

  clearSelection(): void {
    this.drawSource.clear();
    this.selectionSource.clear();
    this.selectedFeatures = {};
    this.layerSelections = {};
    this.layerSelectionsArray = [];
    this.totalSelected = 0;
    this.showResults = false;
    this.drawingMode = null;
    this.lastDrawGeometry = null;
    if (this.bufferUpdateTimer) {
      clearTimeout(this.bufferUpdateTimer);
      this.bufferUpdateTimer = null;
    }

    if (this.drawInteraction && this.map) {
      this.map.removeInteraction(this.drawInteraction);
      this.drawInteraction = null;
    }
    this.updateCursor();
    this.cdr.detectChanges();
  }

  private onDrawEnd(event: any): void {
    // Garantir que apenas a última geometria desenhada permaneça
    const drawnFeature = event.feature;
    const features = this.drawSource.getFeatures();
    features.forEach((f) => {
      if (f !== drawnFeature) this.drawSource.removeFeature(f);
    });

    const geometry = drawnFeature.getGeometry();
    this.lastDrawGeometry = geometry?.clone?.() ?? geometry;
    this.performSpatialSelection(geometry);
  }

  onBufferSliderInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (!isNaN(value)) {
      this.bufferDistance = value;
      if (this.drawingMode === 'point' && this.lastDrawGeometry) {
        if (this.bufferUpdateTimer) {
          clearTimeout(this.bufferUpdateTimer);
        }
        this.bufferUpdateTimer = setTimeout(() => {
          const geom =
            this.lastDrawGeometry?.clone?.() ?? this.lastDrawGeometry;
          if (geom) {
            this.performSpatialSelection(geom);
          }
          this.bufferUpdateTimer = null;
        }, 250);
      }
      this.cdr.detectChanges();
    }
  }

  private async performSpatialSelection(drawGeometry: Geometry): Promise<void> {
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      this.lastDrawGeometry = drawGeometry?.clone?.() ?? drawGeometry;
      // Converter geometria para critério WFS (coordenadas em EPSG:31984 com buffer)
      const criterion = this.geometryToCriterion(drawGeometry);

      // Iterar todas as camadas ativas do conteúdo
      const allFeatures: SelectedFeature[] = [];

      for (const objeto of this.conteudoService.dadosAdicionais) {
        if (!objeto.ativo) continue;

        try {
          if (objeto.tipoConteudo === 'mapa' && objeto.camadas) {
            // Para mapas, iterar todas as camadas
            for (const camada of objeto.camadas) {
              const layerName = `content:${camada.nomeCamada}`;
              const features = await this.queryLayerWFS(
                objeto.tipoConteudo,
                layerName,
                criterion,
                camada.atributos || [],
              );
              allFeatures.push(...features);
            }
          } else {
            // Para conteúdo individual
            const features = await this.queryLayerWFS(
              objeto.tipoConteudo,
              objeto.nomeConteudo,
              criterion,
              objeto.atributos || [],
            );
            allFeatures.push(...features);
          }
        } catch (error) {
          console.error(
            'Erro ao buscar features em',
            objeto.nomeConteudo,
            error,
          );
        }
      }

      this.processSpatialResults(allFeatures);
    } catch (error) {
      console.error('Erro ao executar pesquisa espacial:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Converte geometria OL para critério WFS
   * Transforma para EPSG:31984 e cria um buffer de 50m
   */
  private geometryToCriterion(geometry: Geometry): string {
    try {
      // Se for ponto: manter formato "x,y;buffer"
      const type = (geometry as any).getType?.() || '';
      if (type === 'Point') {
        const coord = (geometry as any).getCoordinates();
        const [x84, y84] = transform(coord, 'EPSG:3857', 'EPSG:31984') as [
          number,
          number,
        ];
        const buffer = this.bufferDistance || 30;
        return `${x84},${y84};${buffer}`;
      }
      // Para polígonos/retângulos: enviar geometria completa em EPSG:31984 (GeoJSON string)
      let geom = (geometry as any).clone();

      // Sanitização específica para freehand (muitos vértices / auto-interseções)
      if (this.drawingMode === 'freehand' && type === 'Polygon') {
        try {
          // 1. Simplificar geometria (reduz vértices mantendo forma geral)
          const mapRes = this.map?.getView().getResolution() || 1; // fallback
          // Tolerância: duas vezes a resolução atual (ajuste empírico)
          const tolerance = mapRes * 2;
          const simplified = geom.simplify ? geom.simplify(tolerance) : geom;

          // 2. Se ainda houver muitos vértices, subamostrar
          const coords = simplified.getCoordinates?.();
          if (Array.isArray(coords) && coords.length > 0) {
            const outerRing = coords[0];
            const maxVertices = 800; // Limite máximo para evitar payload gigante
            if (outerRing.length > maxVertices) {
              const step = Math.ceil(outerRing.length / maxVertices);
              const reduced = outerRing.filter(
                (_: any, idx: number) => idx % step === 0,
              );
              // Garantir fechamento do anel
              if (reduced.length < 3) {
                // fallback para bounding box se degenerado
                const extentGeom = geom.getExtent?.();
                if (extentGeom) {
                  const [minX, minY, maxX, maxY] = extentGeom;
                  reduced.push(
                    [minX, minY],
                    [maxX, minY],
                    [maxX, maxY],
                    [minX, maxY],
                    [minX, minY],
                  );
                }
              } else {
                const first = reduced[0];
                const last = reduced[reduced.length - 1];
                if (first[0] !== last[0] || first[1] !== last[1]) {
                  reduced.push([...first]);
                }
              }
              simplified.setCoordinates([reduced]);
            } else {
              // Garantir fechamento do anel mesmo sem redução
              const first = outerRing[0];
              const last = outerRing[outerRing.length - 1];
              if (
                first &&
                last &&
                (first[0] !== last[0] || first[1] !== last[1])
              ) {
                outerRing.push([...first]);
                simplified.setCoordinates([outerRing]);
              }
            }
          }
          geom = simplified;
        } catch (e) {
          console.warn(
            'Falha ao simplificar geometria freehand, usando original:',
            e,
          );
        }
      }

      // Transformar para destino
      geom.transform('EPSG:3857', 'EPSG:31984');
      const geo = new GeoJSON().writeGeometryObject(geom);
      return JSON.stringify(geo);
    } catch (error) {
      console.error('Erro ao converter geometria para critério:', error);
      return '0,0;100';
    }
  }

  /**
   * Query WFS para uma camada específica
   */
  private async queryLayerWFS(
    tipoConteudo: string,
    layerName: string,
    criterion: string,
    atributos: any[],
  ): Promise<SelectedFeature[]> {
    try {
      const filtro = this.drawingMode === 'point' ? 'coordenadas' : 'geometria';
      const response = (await this.conteudoService
        .getWFSLayerData(tipoConteudo, layerName, atributos, filtro, criterion)
        .toPromise()) as any;

      const features: SelectedFeature[] = [];

      if (Array.isArray(response) && response.length > 0) {
        const data = response[0];
        if (data.data && Array.isArray(data.data.features)) {
          data.data.features.forEach((feature: any) => {
            const selectedFeature: SelectedFeature = {
              id:
                feature.properties?.id?.toString() || Math.random().toString(),
              properties: feature.properties || {},
              geometry: feature.geometry,
              camada: layerName,
              layerName: data.layerName || layerName,
            };
            features.push(selectedFeature);
          });
        }
      }

      return features;
    } catch (error) {
      console.error('Erro ao fazer query WFS para', layerName, error);
      return [];
    }
  }

  private processSpatialResults(features: SelectedFeature[]): void {
    this.selectionSource.clear();
    this.selectedFeatures = {};
    this.layerSelections = {};

    features.forEach((feature) => {
      const camadaId = feature.camada;
      if (!this.layerSelections[camadaId]) {
        this.layerSelections[camadaId] = {
          nome: feature.layerName,
          features: [],
          count: 0,
        };
      }

      this.layerSelections[camadaId].features.push(feature);
      this.layerSelections[camadaId].count++;

      const key = `${camadaId}:${feature.id}`;
      this.selectedFeatures[key] = feature;

      const geoJsonFormat = new GeoJSON();
      const olFeature = geoJsonFormat.readFeature(feature.geometry) as any;
      if (olFeature) {
        this.selectionSource.addFeature(olFeature);
      }
    });

    this.totalSelected = features.length;
    this.showResults = this.totalSelected > 0;
    this.layerSelectionsArray = Object.entries(this.layerSelections);
    this.cdr.detectChanges();
  }

  toggleMultipleSelection(
    event: KeyboardEvent,
    feature: SelectedFeature,
  ): void {
    if (event.ctrlKey || event.metaKey) {
      const key = `${feature.camada}:${feature.id}`;
      if (this.selectedFeatures[key]) {
        delete this.selectedFeatures[key];
        this.totalSelected--;
      } else {
        this.selectedFeatures[key] = feature;
        this.totalSelected++;
      }
      if (this.totalSelected === 0) {
        this.showResults = false;
      }
      this.cdr.detectChanges();
    }
  }

  getSelectionCount(): number {
    return this.totalSelected;
  }

  getLayerBreakdown(): string {
    return Object.entries(this.layerSelections)
      .map(([_, data]) => `${data.nome}: ${data.count}`)
      .join(', ');
  }

  showResults_(): void {
    // Montar estrutura idêntica à produzida por ConteudoService.carregarTabelaDados
    // { camadaNome, geometry_type, features[], dadosVazio }
    const tabelaDados: any[] = [];
    const normalizeLayerName = (name: string) =>
      name.startsWith('content:') ? name.replace('content:', '') : name;

    for (const [layerId, data] of Object.entries(this.layerSelections)) {
      // Attribute-table usa a mesma chave emitida por conteudos.component (nomeCamada sem namespace)
      const camadaNomeReal = normalizeLayerName(layerId);
      let geometryType: string | null = null;

      const features = data.features.map((f) => {
        // Traduzir atributos mantendo chave original quando não houver tradução
        const propriedadesTraduzidas = Object.entries(f.properties).reduce<{
          [key: string]: any;
        }>((acc, [key, value]) => {
          try {
            const label = this.conteudoService.translateAttributeNameToLabel(
              camadaNomeReal,
              key,
            );
            acc[label] = value;
          } catch {
            acc[key] = value;
          }
          return acc;
        }, {});
        // Incluir geometria como atributo especial (necessário para highlight / zoom)
        if (f.geometry) {
          propriedadesTraduzidas['geometry'] = f.geometry;
          if (!geometryType && f.geometry.type) {
            geometryType = f.geometry.type;
          }
        }
        return propriedadesTraduzidas;
      });

      tabelaDados.push({
        camadaNome: camadaNomeReal,
        geometry_type: geometryType,
        features,
        dadosVazio: features.length === 0,
      });
    }

    // Substitui completamente a lista de dados da tabela por este subset
    this.conteudoService.setDadosTabela(tabelaDados);
    this.conteudoService.attributeTableisExpanded = true;

    // Emissão dos eventos por camada seguindo padrão do conteudos.component
    // Primeiro imediato, demais com pequeno atraso para evitar corrida de inicialização
    const camadas = tabelaDados.map((d) => d.camadaNome);

    // Ajustar flags tableAttribute para que o template da attribute-table gere as abas
    // (Ele percorre conteudoService.dadosAdicionais e mostra apenas onde tableAttribute=true)
    const selecionadasSet = new Set(camadas);
    this.conteudoService.dadosAdicionais =
      this.conteudoService.dadosAdicionais.map((obj) => {
        if (obj.tipoConteudo === 'camada') {
          obj.tableAttribute = selecionadasSet.has(obj.nomeConteudo);
        } else if (obj.tipoConteudo === 'mapa' && Array.isArray(obj.camadas)) {
          obj.camadas = obj.camadas.map((sub) => {
            sub.tableAttribute = selecionadasSet.has(sub.nomeCamada);
            return sub;
          });
          obj.tableAttribute = obj.camadas.some((sub) => sub.tableAttribute);
        }
        return obj;
      });

    camadas.forEach((layerName, idx) => {
      setTimeout(
        () => this.conteudoService.emitTableDataChange(layerName),
        idx * 50,
      );
    });
  }

  private getDrawStyle(): Style {
    return new Style({
      stroke: new Stroke({
        color: '#2196F3',
        width: 3,
        lineDash: [10, 10],
      }),
      fill: new Fill({
        color: 'rgba(33, 150, 243, 0.2)',
      }),
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({
          color: '#2196F3',
        }),
        stroke: new Stroke({
          color: '#1976D2',
          width: 2,
        }),
      }),
    });
  }

  private getSelectionStyle(): Style {
    // Mantido apenas para referência / fallback
    return new Style({
      stroke: new Stroke({ color: '#00BCD4', width: 3 }),
      fill: new Fill({ color: 'rgba(0,188,212,0.25)' }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: '#00BCD4' }),
        stroke: new Stroke({ color: '#008FA1', width: 2 }),
      }),
    });
  }

  /**
   * Estilo moderno de highlight: múltiplos anéis (glow) + pulsação suave.
   * Preserva estilo WMS subjacente por usar apenas contorno e fill leve.
   */
  private getDynamicHighlightStyles(feature: any): Style[] {
    const now = performance.now();
    const pulse = (Math.sin(now / 400) + 1) / 2; // 0..1
    const alphaInner = 0.55 + pulse * 0.25; // 0.55..0.8
    const alphaFill = 0.12 + pulse * 0.08; // 0.12..0.2

    const baseColor = [0, 188, 212]; // Cyan
    const innerColor = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alphaInner})`;
    const outerColor = `rgba(255,255,255,${0.35 + pulse * 0.15})`;
    const fillColor = `rgba(${baseColor[0]},${baseColor[1]},${baseColor[2]},${alphaFill})`;

    const styles: Style[] = [];
    const geomType = feature.getGeometry()?.getType();

    if (geomType === 'Point' || geomType === 'MultiPoint') {
      // Glow para ponto: dois círculos sobrepostos
      styles.push(
        new Style({
          image: new CircleStyle({
            radius: 14,
            fill: new Fill({ color: outerColor }),
          }),
        }),
      );
      styles.push(
        new Style({
          image: new CircleStyle({
            radius: 9,
            fill: new Fill({ color: innerColor }),
            stroke: new Stroke({ color: '#004D60', width: 2 }),
          }),
        }),
      );
    } else {
      // Outer glow stroke
      styles.push(
        new Style({
          stroke: new Stroke({
            color: outerColor,
            width: 10,
            lineCap: 'round',
            lineJoin: 'round',
          }),
        }),
      );
      // Inner bright stroke
      styles.push(
        new Style({
          stroke: new Stroke({
            color: innerColor,
            width: 4 + pulse * 2, // anima leve na espessura
            lineCap: 'round',
            lineJoin: 'round',
          }),
          fill: new Fill({ color: fillColor }),
        }),
      );
    }

    // Força re-render para animação enquanto existirem selecionados
    if (this.selectionSource.getFeatures().length > 0) {
      this.map?.render();
    }
    return styles;
  }

  private updateCursor(): void {
    if (!this.map) return;
    const viewport = this.map.getViewport();
    if (!viewport) return;

    switch (this.drawingMode) {
      case 'polygon':
        viewport.style.cursor = 'crosshair';
        break;
      case 'point':
        viewport.style.cursor = 'pointer';
        break;
      case 'box':
        viewport.style.cursor = 'cell';
        break;
      case 'freehand':
        viewport.style.cursor = 'crosshair';
        break;
      default:
        viewport.style.cursor = 'default';
    }
  }

  getSelectedData(): any {
    return {
      totalFeatures: this.totalSelected,
      layerBreakdown: this.layerSelections,
      features: Object.values(this.selectedFeatures),
      metadata: {
        source: 'spatial-search',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
