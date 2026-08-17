import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { MapaService } from 'src/app/services/mapa.service';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

function isWmsLayer(layer: any): boolean {
  // A "content" WMS layer is one whose id starts with "content:" — the
  // namespace prefix used for vetorial and raster layers. Some basemaps
  // also use TileLayer+TileWMS but never set such an id, so the prefix
  // check prevents misclassifying the basemap as content.
  const id = layer?.get?.('id');
  if (typeof id !== 'string' || !id.startsWith('content:')) return false;
  return (
    (layer instanceof ImageLayer && layer.getSource() instanceof ImageWMS) ||
    (layer instanceof TileLayer && layer.getSource() instanceof TileWMS)
  );
}

function getWmsSource(layer: any): ImageWMS | TileWMS | null {
  if (layer instanceof ImageLayer && layer.getSource() instanceof ImageWMS) {
    return layer.getSource() as ImageWMS;
  }
  if (layer instanceof TileLayer && layer.getSource() instanceof TileWMS) {
    return layer.getSource() as TileWMS;
  }
  return null;
}
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { NgIf, NgFor } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MatSlideToggleModule,
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
} from '@angular/material/slide-toggle';
import { transformExtent } from 'ol/proj';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LayerOpacityComponent } from '../layer-opacity/layer-opacity.component';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import { Subscription } from 'rxjs';
import BaseLayer from 'ol/layer/Base';
import { ThumbnailCacheService } from 'src/app/services/thumbnail-cache.service';

@Component({
  selector: 'app-conteudos',
  templateUrl: './conteudos.component.html',
  styleUrls: ['./conteudos.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
    DragDropModule,
    MatMenuModule,
    NgIf,
    NgFor,
    MatTooltipModule,
    MatButtonModule,
    MatDialogModule,
    MatToolbarModule,
    LayerOpacityComponent,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#2e7d32',
      },
    },
  ],
})
export class ConteudosComponent implements OnInit, OnDestroy {
  pesquisaCamadasAplicadas = '';
  urlWms: string | undefined;
  private tableAttributesSubscription!: Subscription;
  private activeLayersSubscription!: Subscription;
  thumbnailUrls: Map<string, string> = new Map();
  loading: Map<string, boolean> = new Map();
  thumbnailErrors: Map<string, boolean> = new Map();

  // Performance optimization properties
  private intersectionObserver!: IntersectionObserver;
  private loadingQueue: string[] = [];
  private activeRequests = 0;
  private readonly MAX_CONCURRENT_REQUESTS = 4; // Mesmo que organization-content pois lista principal
  private loadedItems = new Set<string>();

  constructor(
    private mapaService: MapaService,
    public conteudoService: ConteudoService,
    public dialog: MatDialog,
    private fetchConfigService: FetchConfigsService,
    private thumbnailCacheService: ThumbnailCacheService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.setupIntersectionObserver(); // Setup lazy loading

    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const urlWmsConfig = configs.find(
        (config) => config.key === 'GEOSERVER_URL',
      );
      this.urlWms = urlWmsConfig?.value ?? undefined;
    });
    this.tableAttributesSubscription =
      this.conteudoService.tableAttributesUpdated$.subscribe(() => {
        this.updateAttributeTableVisibility();
      });
    this.activeLayersSubscription =
      this.conteudoService.atualizarCamadas$.subscribe(() => {
        this.reordenarCamadasMapa();
      });
  }
  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    if (this.tableAttributesSubscription) {
      this.tableAttributesSubscription.unsubscribe();
    }
    if (this.activeLayersSubscription) {
      this.activeLayersSubscription.unsubscribe();
    }
  }
  private reordenarCamadasMapa() {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return;

    const layers = mapa.getLayers();
    const allLayers = layers.getArray();
    const highlightLayer = this.conteudoService.getHighlightLayer();
    const pesquisarHighlightLayers = allLayers.filter(
      (layer) => layer.get('pesquisarCamadasHighlight') === true,
    );
    const nonContentLayers = allLayers.filter(
      (layer) =>
        !isWmsLayer(layer) &&
        layer !== highlightLayer &&
        layer.get('pesquisarCamadasHighlight') !== true,
    );
    const basemap = nonContentLayers[0] ?? null;
    const wmsLayers = allLayers.filter((layer) => isWmsLayer(layer));
    const overlayLayers = basemap
      ? nonContentLayers.slice(1)
      : nonContentLayers;
    const orderedContentLayers: BaseLayer[] = [];
    const addedIds = new Set<string>();
    const addLayerIfNeeded = (layer: BaseLayer | undefined) => {
      const layerId = String(layer?.get?.('id') ?? '');
      if (!layer || !layerId || addedIds.has(layerId)) return;
      orderedContentLayers.push(layer);
      addedIds.add(layerId);
    };

    [...this.conteudoService.dadosAdicionais].reverse().forEach((conteudo) => {
      if (conteudo.tipoConteudo === 'mapa') {
        const mapLayers = wmsLayers.filter((layer) => {
          if (isWmsLayer(layer)) {
            const layerId = layer.get('id');
            return (
              layerId && layerId.startsWith(`content:${conteudo.nomeConteudo}_`)
            );
          }
          return false;
        });
        mapLayers.forEach((layer) => addLayerIfNeeded(layer));
      } else {
        const layer = wmsLayers.find(
          (candidate) =>
            candidate.get('id') === `content:${conteudo.nomeConteudo}`,
        );
        addLayerIfNeeded(layer);
      }
    });

    wmsLayers.forEach((layer) => addLayerIfNeeded(layer));

    let zIndex = 0;
    if (basemap) {
      basemap.setZIndex(zIndex++);
    }

    orderedContentLayers.forEach((layer) => {
      layer.setZIndex(zIndex++);
    });

    overlayLayers.forEach((layer) => {
      layer.setZIndex(1000 + zIndex++);
    });

    if (highlightLayer) {
      highlightLayer.setZIndex(9999);
    }

    pesquisarHighlightLayers.forEach((layer) => {
      layer.setZIndex(10000);
    });

    mapa.updateSize();
    mapa.renderSync();
  }

  moveCamadaParaCima(nomeDaCamada: string) {
    const index = this.conteudoService.dadosAdicionais.findIndex(
      (camada) => camada.nomeConteudo === nomeDaCamada,
    );

    if (index > 0) {
      [
        this.conteudoService.dadosAdicionais[index - 1],
        this.conteudoService.dadosAdicionais[index],
      ] = [
        this.conteudoService.dadosAdicionais[index],
        this.conteudoService.dadosAdicionais[index - 1],
      ];

      this.reordenarCamadasMapa();
    }
  }

  moveCamadaParaBaixo(nomeDaCamada: string) {
    const index = this.conteudoService.dadosAdicionais.findIndex(
      (camada) => camada.nomeConteudo === nomeDaCamada,
    );

    if (index < this.conteudoService.dadosAdicionais.length - 1) {
      [
        this.conteudoService.dadosAdicionais[index],
        this.conteudoService.dadosAdicionais[index + 1],
      ] = [
        this.conteudoService.dadosAdicionais[index + 1],
        this.conteudoService.dadosAdicionais[index],
      ];

      this.reordenarCamadasMapa();
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.conteudoService.dadosAdicionais,
      event.previousIndex,
      event.currentIndex,
    );

    this.reordenarCamadasMapa();
  }
  habilitarTodasCamadas() {
    this.conteudoService.dadosAdicionais.forEach((item) => {
      item.ativo = true;
      const mapa = this.mapaService.getMapa();
      if (mapa) {
        const layers = mapa.getLayers().getArray();
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          if (isWmsLayer(layer)) {
            layer.setVisible(true);
          }
        }
      }
    });
  }

  desabilitarTodasCamadas() {
    this.conteudoService.dadosAdicionais.forEach((item) => {
      item.ativo = false;
      const mapa = this.mapaService.getMapa();
      if (mapa) {
        const layers = mapa.getLayers().getArray();
        for (let i = 0; i < layers.length; i++) {
          const layer = layers[i];
          if (isWmsLayer(layer)) {
            layer.setVisible(false);
          }
        }
      }
    });
  }

  toggleCamadaVisibilidade(status: boolean, conteudoNome: string) {
    const mapa = this.mapaService.getMapa();
    if (mapa) {
      const itemAlvo = this.conteudoService.dadosAdicionais.find(
        (item) => item.nomeConteudo === conteudoNome,
      );
      if (itemAlvo) {
        if (status) {
          mapa
            .getLayers()
            .getArray()
            .forEach((layer) => {
              const source = getWmsSource(layer);
              if (
                source &&
                source.getParams()['LAYERS'] ===
                  `content:${itemAlvo.nomeConteudo}`
              ) {
                itemAlvo.ativo = false;
                layer.setVisible(false);
              }
            });
        } else {
          mapa
            .getLayers()
            .getArray()
            .forEach((layer) => {
              const source = getWmsSource(layer);
              if (
                source &&
                source.getParams()['LAYERS'] ===
                  `content:${itemAlvo.nomeConteudo}`
              ) {
                itemAlvo.ativo = true;
                layer.setVisible(true);
              }
            });
        }
      }
    }
  }

  filtrarCamadasAplicadas() {
    if (this.pesquisaCamadasAplicadas.length >= 3) {
      this.conteudoService.dadosAdicionais =
        this.conteudoService.dadosAdicionais.filter((camada) =>
          camada.tituloConteudo
            .toLowerCase()
            .includes(this.pesquisaCamadasAplicadas.toLowerCase()),
        );
    } else {
      this.conteudoService.dadosAdicionais =
        this.conteudoService.dadosAdicionaisFiltro;
    }
  }

  getExtent(conteudoAtivo: any) {
    const mapa = this.mapaService.getMapa();
    const mapView = mapa?.getView();
    const mapSize = mapa?.getSize();
    const padding = [10, 10, 10, 10];

    if (conteudoAtivo?.boundingBox) {
      try {
        const bboxObj = JSON.parse(conteudoAtivo.boundingBox);
        const extent = [bboxObj.minx, bboxObj.miny, bboxObj.maxx, bboxObj.maxy];

        const extent3857 = transformExtent(extent, 'EPSG:31983', 'EPSG:3857');

        mapView?.fit(extent3857, {
          size: mapSize,
          padding: padding,
          duration: 1000,
        });
      } catch (error) {
        console.error('Erro ao processar boundingBox:', error);
      }
    } else {
      console.warn(
        'BoundingBox não encontrado para o conteúdo:',
        conteudoAtivo.nomeConteudo,
      );
    }
  }

  getThumbnail(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: string = 'camada',
    compositeMap?: any,
  ): string {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
      compositeMap,
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

  mostrarTabelaAtributos(conteudo: any) {
    if (!this.conteudoService.attributeTableisExpanded) {
      this.conteudoService.attributeTableisExpanded = true;
      this.conteudoService.close();
      this.conteudoService.closeExpandPerfilPanel();
    }
    conteudo.tableAttribute = true;
    if (conteudo.tipoConteudo === 'camada') {
      this.carregarDadosParaCamada(conteudo.nomeConteudo);
    } else {
      this.carregarDadosParaMapa(conteudo.nomeConteudo);
    }
  }

  private updateAttributeTableVisibility() {
    const hasVisibleLayers = this.conteudoService.dadosAdicionais.some(
      (camada) =>
        camada.tableAttribute ||
        (camada.camadas &&
          camada.camadas.some((subCamada) => subCamada.tableAttribute)),
    );
    this.conteudoService.attributeTableisExpanded = hasVisibleLayers;
  }

  private carregarDadosParaCamada(nomeCamada: string) {
    const searchArray = this.conteudoService.dadosAdicionais;

    const camadaEncontrada = searchArray.find(
      (camada) =>
        'nomeConteudo' in camada && camada.nomeConteudo === nomeCamada,
    );

    if (camadaEncontrada) {
      this.conteudoService
        .carregarTabelaDados(nomeCamada, camadaEncontrada.atributos ?? [])
        .then(() => {
          this.conteudoService.emitTableDataChange(nomeCamada);
        })
        .catch((error) => {
          console.error('Erro ao carregar dados da camada:', error);
        });
    } else {
      console.warn(`Camada ${nomeCamada} não encontrada em dadosAdicionais.`);
    }
  }

  private carregarDadosParaMapa(nomeMapa: string) {
    const searchArray = this.conteudoService.dadosAdicionaisFiltro;

    const mapaEncontrado = searchArray.find(
      (conteudo) =>
        'nomeConteudo' in conteudo && conteudo.nomeConteudo === nomeMapa,
    );

    if (mapaEncontrado) {
      const camadasComAtributos = mapaEncontrado.camadas.filter(
        (camada) => camada.atributos && camada.atributos.length > 0,
      );

      if (camadasComAtributos.length > 0) {
        camadasComAtributos.forEach((camada) => {
          if (camada.atributos && Array.isArray(camada.atributos)) {
            camada.tableAttribute = true;
            this.conteudoService
              .carregarTabelaDados(camada.nomeCamada, camada.atributos)
              .then(() => {
                this.conteudoService.emitTableDataChange(camada.nomeCamada);
              })
              .catch((error) => {
                console.error(
                  `Erro ao carregar dados da camada ${camada.nomeCamada}:`,
                  error,
                );
              });
          } else {
            console.warn(
              `Atributos da camada ${camada.nomeCamada} são inválidos ou estão ausentes.`,
            );
          }
        });
      } else {
        console.warn(
          `Nenhuma camada com atributos encontrada no mapa ${nomeMapa}.`,
        );
      }
    } else {
      console.warn(`Mapa ${nomeMapa} não encontrado em dadosAdicionaisFiltro.`);
    }
  }

  mostrarPopupCamada(layerName: string) {
    const camada = this.conteudoService.dadosAdicionais.find(
      (c) => c.nomeConteudo === layerName,
    );
    if (camada) {
      camada.popup = !camada.popup;
    }
  }

  getLayerOpacity(
    nomeCamada: string,
    tipoConteudo: string,
  ): BaseLayer | BaseLayer[] | null {
    const mapa = this.mapaService.getMapa();
    if (!mapa) {
      return null;
    }
    const layers = mapa.getLayers().getArray();

    if (tipoConteudo !== 'mapa') {
      const foundLayer = layers.find((layer) => {
        const source = getWmsSource(layer);
        return (
          !!source && source.getParams()['LAYERS'] === `content:${nomeCamada}`
        );
      });

      return foundLayer || null;
    }

    const groupLayers = layers.filter((layer) => {
      if (isWmsLayer(layer)) {
        const layerId = layer.get('id');
        return layerId && layerId.startsWith(`content:${nomeCamada}_`);
      }
      return false;
    });

    return groupLayers.length > 0 ? groupLayers : null;
  }

  removerCamadaDoArray(nomeCamadaOuMapa: string, conteudoAtivo: any) {
    const nomeNormalizado = nomeCamadaOuMapa.replace(/^content:/, '');

    this.conteudoService.dadosAdicionais =
      this.conteudoService.dadosAdicionais?.filter(
        (item) => item.nomeConteudo !== nomeNormalizado,
      ) || [];

    this.conteudoService.dadosAdicionaisFiltro =
      this.conteudoService.dadosAdicionaisFiltro?.filter(
        (item) => item.nomeConteudo !== nomeNormalizado,
      ) || [];

    const mapa = this.mapaService.getMapa();
    if (mapa) {
      const layers = mapa.getLayers().getArray();

      if (conteudoAtivo.camadas?.length) {
        conteudoAtivo.camadas.forEach((camada: { nomeCamada: string }) => {
          const layerToRemove = layers.find(
            (layer) =>
              layer.get('id') ===
              `content:${nomeNormalizado}_${camada.nomeCamada}`,
          );
          if (layerToRemove) {
            mapa.removeLayer(layerToRemove);
          }
        });
      }

      if (conteudoAtivo.camadasRaster?.length) {
        conteudoAtivo.camadasRaster.forEach(
          (camadaRaster: {
            nomeCamada: string;
            fonteDadosCamadaRaster: string;
          }) => {
            const layerToRemove = layers.find(
              (layer) =>
                layer.get('id') ===
                `content:${nomeNormalizado}_${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`,
            );
            if (layerToRemove) {
              mapa.removeLayer(layerToRemove);
            }
          },
        );
      }

      if (
        !conteudoAtivo.camadas?.length &&
        !conteudoAtivo.camadasRaster?.length
      ) {
        const layerToRemove = layers.find(
          (layer) => layer.get('id') === nomeNormalizado,
        );
        if (layerToRemove) {
          mapa.removeLayer(layerToRemove);
        }
      }
    }

    this.conteudoService.notificarCamadaRemovida(
      `content:${nomeNormalizado}`,
      false,
    );
    this.conteudoService.emitirAtualizacao();
  }

  openPerfilPanel(layerName: string) {
    this.conteudoService.toggleExpandPerfilPanel(layerName);
    this.conteudoService.close();
  }

  // Performance optimization methods for thumbnail lazy loading

  private setupIntersectionObserver(): void {
    if (!window.IntersectionObserver) {
      // Fallback: load thumbnails immediately for older browsers
      console.warn(
        'Intersection Observer not supported in conteudos component.',
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
        rootMargin: '100px 0px', // Mesmo margin que organization-content
        threshold: 0.1,
      },
    );
  }

  private loadThumbnailForItem(itemId: string): void {
    try {
      const targetItem = this.conteudoService.dadosAdicionais.find(
        (conteudo) =>
          this.getItemId(
            conteudo.nomeConteudo,
            conteudo.boundingBox,
            conteudo.fonteDadosCamadaRaster,
            conteudo.tipoConteudo,
            conteudo,
          ) === itemId,
      );

      if (targetItem?.nomeConteudo) {
        const imageUrl = this.generateThumbnailUrl(
          targetItem.nomeConteudo,
          targetItem.boundingBox,
          targetItem.fonteDadosCamadaRaster,
          targetItem.tipoConteudo ?? 'camada',
          targetItem,
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

  private normalizeContentName(layerName: string): string {
    return layerName.replace(/^content:/, '');
  }

  private buildRasterThumbnailLayerName(
    layerName: string,
    fonteDadosCamadaRaster?: string,
  ): string {
    const normalizedLayerName = this.normalizeContentName(layerName);

    if (!fonteDadosCamadaRaster) {
      return `content:${normalizedLayerName}`;
    }

    const rasterSuffix = `_${fonteDadosCamadaRaster}`;
    if (normalizedLayerName.endsWith(rasterSuffix)) {
      return `content:${normalizedLayerName}`;
    }

    return `content:${normalizedLayerName}${rasterSuffix}`;
  }

  private resolveCompositeMap(compositeMap?: any): any {
    if (compositeMap?.camadas?.length || compositeMap?.camadasRaster?.length) {
      return compositeMap;
    }

    const normalizedName = this.normalizeContentName(
      compositeMap?.nomeConteudo ?? '',
    );
    if (!normalizedName) {
      return compositeMap;
    }

    return (
      this.conteudoService.grupoCamadas
        .flatMap((grupo) => grupo.mapas || [])
        .find((mapa) => mapa.nomeMapa === normalizedName) ?? compositeMap
    );
  }

  private getCompositeLayersParam(compositeMap: any): string {
    const resolvedMap = this.resolveCompositeMap(compositeMap);
    const allLayers = [
      ...(resolvedMap.camadas || []),
      ...(resolvedMap.camadasRaster || []),
    ];

    return [...allLayers]
      .sort((a, b) => b.ordemRenderizacao - a.ordemRenderizacao)
      .map((layer) => {
        const baseName = `content:${layer.nomeCamada}`;
        if ('fonteDadosCamadaRaster' in layer && layer.fonteDadosCamadaRaster) {
          return `${baseName}_${layer.fonteDadosCamadaRaster}`;
        }
        return baseName;
      })
      .join(',');
  }

  private generateThumbnailUrl(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: string = 'camada',
    compositeMap?: any,
  ): string {
    const normalizedLayerName = this.normalizeContentName(layerName);
    const fullLayerName = `content:${normalizedLayerName}`;

    if (contentType === 'mapa' && compositeMap) {
      const resolvedMap = this.resolveCompositeMap(compositeMap);
      const mapBoundingBox = resolvedMap?.boundingBoxMapa || boundingBox;
      const { bbox, width, height } =
        this.getThumbnailDimensions(mapBoundingBox);
      const layersString = this.getCompositeLayersParam(resolvedMap);
      return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${layersString}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31983&styles=&format=image/png&transparent=true`;
    }

    if (contentType === 'raster') {
      const rasterLayerName = this.buildRasterThumbnailLayerName(
        layerName,
        fonteDadosCamadaRaster,
      );
      return `/geoserver-proxy/content/wms/reflect?layers=${encodeURIComponent(rasterLayerName)}&format=image/png&width=800&height=600`;
    }

    const { bbox, width, height } = this.getThumbnailDimensions(boundingBox);
    return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=${bbox}&width=${width}&height=${height}&srs=EPSG:31983&styles=&format=image/png&transparent=true`;
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
          'Failed to load thumbnail in conteudos, continuing with next:',
          error,
        );
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
        this.activeRequests--;
        this.processQueue();
      },
    });
  }

  // Check if thumbnail is loading
  isThumbnailLoading(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: string = 'camada',
    compositeMap?: any,
  ): boolean {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
      compositeMap,
    );
    return this.loading.get(imageUrl) || false;
  }

  // Check if thumbnail has error
  hasThumbnailError(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: string = 'camada',
    compositeMap?: any,
  ): boolean {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
      compositeMap,
    );
    return this.thumbnailErrors.get(imageUrl) || false;
  }

  // Generate unique item ID for intersection observer
  getItemId(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: string = 'camada',
    compositeMap?: any,
  ): string {
    const compositeKey =
      contentType === 'mapa' ? this.getCompositeLayersParam(compositeMap) : '';
    return `${layerName}|${boundingBox || ''}|${fonteDadosCamadaRaster || ''}|${contentType}|${compositeKey}`;
  }

  // Reload thumbnail with error recovery
  reloadThumbnail(
    layerName: string,
    boundingBox?: string,
    fonteDadosCamadaRaster?: string,
    contentType: string = 'camada',
    compositeMap?: any,
  ): void {
    const imageUrl = this.generateThumbnailUrl(
      layerName,
      boundingBox,
      fonteDadosCamadaRaster,
      contentType,
      compositeMap,
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
        console.error('Error reloading thumbnail in conteudos:', error);
        this.loading.set(imageUrl, false);
        this.thumbnailErrors.set(imageUrl, true);
      },
    });
  }

  // Observer thumbnail container
  observeThumbnail(element: HTMLElement, itemId: string): void {
    if (this.intersectionObserver && element) {
      element.setAttribute('data-item-id', itemId);
      this.intersectionObserver.observe(element);
    }
  }
}
