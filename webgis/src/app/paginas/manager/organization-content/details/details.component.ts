import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import OSM from 'ol/source/OSM';
import { View } from 'ol';
import { fromLonLat, transformExtent } from 'ol/proj';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, catchError, of } from 'rxjs';
import { ConteudoService } from 'src/app/services/api/conteudo.service';
import ImageLayer from 'ol/layer/Image';
import { ImageWMS } from 'ol/source';
import { Camadas } from 'src/app/models/camadas.model';
import { FetchAtributosService } from 'src/app/services/api/fetch.atributos.camadas.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import {
  CamadaComOrdem,
  CamadaRasterComOrdem,
  MapaResponse,
  Mapas,
} from 'src/app/models/mapas.model';
import { forkJoin } from 'rxjs';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { get as getProjection } from 'ol/proj';
import { CamadasRaster } from 'src/app/models/camadas.raster.model';
import { createRasterTileLayer } from 'src/app/services/ol-raster-source.factory';

type CamadaCombinada = CamadaComOrdem | CamadaRasterComOrdem;
type PreviewLayer = ImageLayer<ImageWMS> | TileLayer<TileWMS>;

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    MatDividerModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef;

  map!: Map;

  toggleSubscription!: Subscription;

  @Input()
  content!: Camadas | CamadasRaster | Mapas;

  @Output() closeSidenav = new EventEmitter<void>();

  legendUrls: string[] = [];

  atributos: any[] = [];
  atributosMapas: any[][] = [];

  downloadUrl = '';
  owsUrl = '';

  urlWms: string | undefined;
  combinedCamadas: (Camadas | CamadasRaster)[] = [];
  addedLayers: { [key: string]: PreviewLayer } = {};

  constructor(
    public conteudoService: ConteudoService,
    public fetchAtributosService: FetchAtributosService,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    private fetchConfigService: FetchConfigsService,
  ) {
    proj4.defs(
      'EPSG:31984',
      '+proj=utm +zone=24 +south +datum=WGS84 +units=m +no_defs',
    );
    proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs');
    proj4.defs(
      'EPSG:3857',
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
    );
    register(proj4);
    register(proj4);
  }

  ngAfterViewInit() {
    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const urlWmsConfig = configs.find(
        (config) => config.key === 'GEOSERVER_URL',
      );
      this.urlWms = urlWmsConfig?.value ?? undefined;
      const latitude = configs.find((config) => config.key === 'LATITUDE');
      const longitude = configs.find((config) => config.key === 'LONGITUDE');
      if (latitude && longitude) {
        if (this.mapContainer && this.mapContainer.nativeElement) {
          this.initializeMap(
            parseFloat(latitude.value ?? ''),
            parseFloat(longitude.value ?? ''),
          );
        }
        this.toggleSubscription =
          this.conteudoService.expandPanelPerfil$.subscribe((content) => {
            if (content) {
              this.content = content;
            }
          });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && this.map) {
      this.refreshContentPreview();
    }
  }

  emitCloseSidenav() {
    this.closeSidenav.emit();
  }

  initializeMap(latitude: number, longitude: number) {
    this.map = new Map({
      target: this.mapContainer.nativeElement,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([longitude, latitude]),
        zoom: 8,
      }),
    });

    this.map.on('moveend', () => {
      this.downloadUrl = this.generateDownloadUrl();
    });

    this.map.getView().on(['change:center', 'change:resolution'], () => {
      this.downloadUrl = this.generateDownloadUrl();
    });

    this.refreshContentPreview();
  }

  ngOnDestroy() {
    if (this.toggleSubscription) {
      this.toggleSubscription.unsubscribe();
    }
  }

  getTitulo(): string {
    if (this.isCamada(this.content)) {
      return this.content.tituloCamada ?? 'Título Indisponível';
    } else if (this.isMapa(this.content)) {
      return this.content.tituloMapa ?? 'Título Indisponível';
    } else {
      return 'Título Indisponível';
    }
  }

  getDescricao(): string {
    if (this.isCamada(this.content)) {
      return this.content.descricaoCamada ?? 'Descrição indisponível';
    } else if (this.isMapa(this.content)) {
      return this.content.descricaoMapa ?? 'Descrição indisponível';
    } else {
      return 'Descrição indisponível';
    }
  }

  getTemaNome(): string {
    if (this.isCamada(this.content)) {
      return this.content.temaCamadaNome ?? 'Tema indisponível';
    } else if (this.isMapa(this.content)) {
      return this.content.temaMapaNome ?? 'Tema indisponível';
    } else {
      return 'Tema indisponível';
    }
  }

  getGrupoNome(): string {
    if (this.isCamada(this.content)) {
      return this.content.grupoCamadaNome ?? 'Grupo indisponível';
    } else if (this.isMapa(this.content)) {
      return this.content.grupoMapaNome ?? 'Grupo indisponível';
    } else {
      return 'Grupo indisponível';
    }
  }

  updateLegendUrl(): void {
    if (!this.map || !this.content) {
      return;
    }

    const layers = this.map.getLayers().getArray();
    const resolution = this.map.getView().getResolution();
    const legendUrls: string[] = [];

    if (this.isMapa(this.content)) {
      if (this.content.camadas) {
        for (const camada of this.content.camadas) {
          const layerName = camada.nomeCamada;
          const legendLayerName = `content:${layerName}`;

          const layer = layers.find((l) => {
            const source = this.getWmsSource(l as PreviewLayer);
            return source?.getParams().LAYERS === legendLayerName;
          }) as PreviewLayer | undefined;

          if (layer) {
            const source = this.getWmsSource(layer);
            if (source) {
              const legendUrl = source.getLegendUrl(resolution);
              if (legendUrl) {
                legendUrls.push(legendUrl);
              }
            }
          }
        }
      }

      if (this.content.camadasRaster) {
        for (const camadaRaster of this.content.camadasRaster) {
          const layerName = `${camadaRaster.nomeCamada}_${camadaRaster.fonteDadosCamadaRaster}`;
          const legendLayerName = `content:${layerName}`;

          const layer = layers.find((l) => {
            const source = this.getWmsSource(l as PreviewLayer);
            return source?.getParams().LAYERS === legendLayerName;
          }) as PreviewLayer | undefined;

          if (layer) {
            const source = this.getWmsSource(layer);
            if (source) {
              const legendUrl = source.getLegendUrl(resolution);
              if (legendUrl) {
                legendUrls.push(legendUrl);
              }
            }
          }
        }
      }
    } else if ('nomeCamada' in this.content) {
      const layerName =
        'fonteDadosCamadaRaster' in this.content &&
        this.content.fonteDadosCamadaRaster
          ? `${this.content.nomeCamada}_${this.content.fonteDadosCamadaRaster}`
          : this.content.nomeCamada;

      const legendLayerName = `content:${layerName}`;

      const layer = layers.find((l) => {
        const source = this.getWmsSource(l as PreviewLayer);
        return source?.getParams().LAYERS === legendLayerName;
      }) as PreviewLayer | undefined;

      if (layer) {
        const source = this.getWmsSource(layer);
        if (source) {
          const legendUrl = source.getLegendUrl(resolution);
          if (legendUrl) {
            legendUrls.push(legendUrl);
          }
        }
      }
    }

    this.legendUrls = legendUrls;
  }

  public getAtributos() {
    if (!this.map || !this.content) {
      return;
    }
    this.fetchAtributosService
      .getAtributos(this.content.id)
      .pipe(
        catchError((error) => {
          return of([]);
        }),
      )
      .subscribe((atributos) => {
        this.atributos = atributos;
      });
  }

  public getAtributosCamadasDoMapa() {
    this.atributosMapas = [];
    if (!this.map || !this.isMapa(this.content) || !this.content.camadas) {
      return;
    }
    const observables = this.content.camadas.map((camada) =>
      this.fetchAtributosService.getAtributos(camada.id).pipe(
        catchError((error) => {
          return of([]);
        }),
      ),
    );

    forkJoin(observables).subscribe((result) => {
      this.atributosMapas = result;
    });
  }

  private getLayerKey(camada: CamadaCombinada): string {
    if ('fonteDadosCamadaRaster' in camada) {
      return `content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}`;
    } else {
      return `content:${camada.nomeCamada}`;
    }
  }

  private getWmsSource(
    layer: PreviewLayer | undefined,
  ): ImageWMS | TileWMS | null {
    const source = layer?.getSource();
    if (source instanceof ImageWMS || source instanceof TileWMS) {
      return source;
    }
    return null;
  }

  applyDefaultExtent() {
    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const urlWmsConfig = configs.find(
        (config) => config.key === 'GEOSERVER_URL',
      );
      this.urlWms = urlWmsConfig?.value ?? undefined;
      const latitude = configs.find((config) => config.key === 'LATITUDE');
      const longitude = configs.find((config) => config.key === 'LONGITUDE');
      if (latitude && longitude) {
        const view = this.map.getView();
        view.setCenter(
          fromLonLat([
            parseFloat(longitude.value ?? ''),
            parseFloat(latitude.value ?? ''),
          ]),
        );
        view.setZoom(8);
      }
    });
  }

  addWMSLayer() {
    if (!this.map || !this.content) {
      return;
    }

    Object.values(this.addedLayers).forEach((layer) => {
      this.map.removeLayer(layer);
    });
    this.addedLayers = {};

    if (this.isMapa(this.content)) {
      this.fitMapToExtent();
    } else {
      this.fitMapToContentExtent();
    }

    const sortedCamadas = (this.combinedCamadas as CamadaCombinada[]).sort(
      (a, b) => b.ordemRenderizacao - a.ordemRenderizacao,
    );

    for (const camada of sortedCamadas) {
      const layerKey = this.getLayerKey(camada);
      if (!this.addedLayers[layerKey]) {
        const wmsLayer: PreviewLayer =
          'fonteDadosCamadaRaster' in camada
            ? createRasterTileLayer(layerKey, camada.tituloCamada, {
                zIndex: 1000 - camada.ordemRenderizacao,
              })
            : new ImageLayer({
                source: new ImageWMS({
                  url: `/geoserver-proxy/content/wms`,
                  params: {
                    FORMAT: 'image/png',
                    VERSION: '1.1.1',
                    LAYERS: layerKey,
                    name: layerKey,
                  },
                  serverType: 'geoserver',
                }),
                zIndex: 1000 - camada.ordemRenderizacao,
              });

        wmsLayer.set('id', layerKey);

        this.map.addLayer(wmsLayer);
        this.addedLayers[layerKey] = wmsLayer;
      }
    }

    this.updateRenderOrder();
  }

  updateRenderOrder(): void {
    if (!this.map) {
      return;
    }

    for (const camada of this.combinedCamadas as CamadaCombinada[]) {
      const layerKey = this.getLayerKey(camada);
      const layer = this.addedLayers[layerKey];
      if (layer) {
        layer.setZIndex(1000 - camada.ordemRenderizacao);
      }
    }

    this.map.renderSync();
  }

  initializeMapWithLayerConditions() {
    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const latitudeConfig = configs.find(
        (config) => config.key === 'LATITUDE',
      );
      const longitudeConfig = configs.find(
        (config) => config.key === 'LONGITUDE',
      );

      if (latitudeConfig && longitudeConfig) {
        const latitude = parseFloat(latitudeConfig.value ?? '');
        const longitude = parseFloat(longitudeConfig.value ?? '');

        const view = new View({
          center: fromLonLat([longitude, latitude]),
          zoom: 8,
        });

        this.map.setView(view);
      }
    });
  }

  fitMapToExtent(retryCount = 0) {
    const extent3857 = this.getBoundingBox();

    if (extent3857 && extent3857.every((coord) => isFinite(coord))) {
      const view = this.map.getView();
      const size = this.map.getSize();

      if (size && size[0] > 0 && size[1] > 0) {
        const resolution = view.getResolutionForExtent(extent3857, size);

        if (isFinite(resolution) && resolution > 0) {
          const zoom = view.getZoomForResolution(resolution) || 19;

          if (isFinite(zoom)) {
            view.fit(extent3857, {
              size: size,
              padding: [50, 50, 50, 50],
              duration: 1000,
            });

            const minZoom = 2;
            const maxZoom = 19;
            const clampedZoom = Math.min(Math.max(zoom, minZoom), maxZoom);
            view.setZoom(clampedZoom);
          } else {
            this.applyDefaultView();
          }
        } else {
          this.applyDefaultView();
        }
      } else {
        if (retryCount < 5) {
          setTimeout(() => this.fitMapToExtent(retryCount + 1), 1000);
        } else {
          this.applyDefaultView();
        }
      }
    } else {
      this.applyDefaultView();
    }
  }

  applyDefaultView() {
    const view = this.map.getView();
    view.setCenter([0, 0]);
    view.setZoom(2);
  }
  getBoundingBox() {
    if (this.isMapa(this.content) && this.content.boundingBoxMapa) {
      try {
        const boundingBox = JSON.parse(this.content.boundingBoxMapa);

        const [minx, miny] = proj4('EPSG:31984', 'EPSG:3857', [
          boundingBox.minx,
          boundingBox.miny,
        ]);
        const [maxx, maxy] = proj4('EPSG:31984', 'EPSG:3857', [
          boundingBox.maxx,
          boundingBox.maxy,
        ]);

        const extent3857 = [minx, miny, maxx, maxy];

        return extent3857;
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
  }

  private fitMapToContentExtent() {
    if (
      !this.content ||
      !('boundingBox' in this.content) ||
      !this.content.boundingBox
    ) {
      this.applyDefaultExtent();
      return;
    }

    try {
      const bbox = JSON.parse(this.content.boundingBox);
      const extent = [bbox.minx, bbox.miny, bbox.maxx, bbox.maxy];
      const extent3857 = transformExtent(
        extent,
        bbox.crs || 'EPSG:31984',
        'EPSG:3857',
      );

      this.map.getView().fit(extent3857, {
        size: this.map.getSize(),
        padding: [50, 50, 50, 50],
        duration: 1000,
      });
    } catch (error) {
      this.applyDefaultExtent();
    }
  }

  applyDefaultBoundingBox() {
    const layers = this.map.getLayers().getArray();
    const baseLayer = layers.find((layer) => layer instanceof TileLayer);
    if (baseLayer && this.map) {
      const view = this.map.getView();
      const extent = view.calculateExtent(this.map.getSize());
      view.fit(extent, { size: this.map.getSize() });
    }
  }

  public shareConteudo() {
    if (!this.content) return;
    const baseURL = `${window.location.protocol}//${window.location.host}/webgis?`;
    const urlParams = new URLSearchParams();
    if ('temaId' in this.content) urlParams.set('tema', this.content.temaId);
    if ('grupoCamada' in this.content)
      urlParams.set('grupoConteudo', this.content.grupoCamada);
    else urlParams.set('grupoConteudo', this.content.grupoMapa);
    urlParams.set('conteudo', this.content.id);
    this.clipboard.copy(baseURL + urlParams.toString());
    this.snackBar.open('URL Copiada', '', {
      duration: 2000,
    });
  }
  downloadImage(url: string, filename: string) {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        this.snackBar.open('Erro ao fazer download da imagem', '', {
          duration: 2000,
        });
      });
  }

  generateDownloadUrl(): string {
    const layerName =
      'nomeCamada' in this.content
        ? 'fonteDadosCamadaRaster' in this.content &&
          (this.content.fonteDadosCamadaRaster as unknown as CamadasRaster)
          ? `${this.content.nomeCamada}_${this.content.fonteDadosCamadaRaster}`
          : this.content.nomeCamada
        : this.content.nomeMapa;

    if (this.isCamada(this.content) && this.content.tipo === 'raster') {
      try {
        const view = this.map.getView();
        const currentExtent = view.calculateExtent(this.map.getSize() || []);
        const [minX, minY] = proj4('EPSG:3857', 'EPSG:31984', [
          currentExtent[0],
          currentExtent[1],
        ]);
        const [maxX, maxY] = proj4('EPSG:3857', 'EPSG:31984', [
          currentExtent[2],
          currentExtent[3],
        ]);

        if (
          minX === maxX ||
          minY === maxY ||
          !this.isValidExtent(minX, minY, maxX, maxY)
        ) {
          return this.getDefaultDownloadUrl(layerName);
        }

        const bbox = `${minX},${minY},${maxX},${maxY}`;
        return `/geoserver-proxy/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=content:${layerName}&bbox=${bbox}&width=768&height=560&srs=EPSG:31984&styles=&format=image/png`;
      } catch (error) {
        return this.getDefaultDownloadUrl(layerName);
      }
    } else {
      return `/geoserver-proxy/content/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=content:${layerName}&outputFormat=SHAPE-ZIP`;
    }
  }

  initiateDownload() {
    const url = this.generateDownloadUrl();
    const layerName =
      'nomeCamada' in this.content
        ? 'fonteDadosCamadaRaster' in this.content &&
          (this.content.fonteDadosCamadaRaster as unknown as CamadasRaster)
          ? `${this.content.nomeCamada}_${this.content.fonteDadosCamadaRaster}`
          : this.content.nomeCamada
        : this.content.nomeMapa;

    if (this.isCamada(this.content) && this.content.tipo === 'raster') {
      this.downloadImage(url, `${layerName}.png`);
    } else {
      this.downloadImage(url, `${layerName}.zip`);
    }
  }

  private isValidExtent(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): boolean {
    return (
      !isNaN(minX) &&
      !isNaN(minY) &&
      !isNaN(maxX) &&
      !isNaN(maxY) &&
      minX < maxX &&
      minY < maxY &&
      Math.abs(maxX - minX) > 0.000001 &&
      Math.abs(maxY - minY) > 0.000001
    );
  }

  private getDefaultDownloadUrl(layerName: string): string {
    return `${this.urlWms}/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=content:${layerName}&bbox=357765.33228664903,7751439.342910469,373099.93228754157,7762623.34291112&width=768&height=560&srs=EPSG:31984&styles=&format=image/png`;
  }

  generateOWSUrl(): string {
    const layerName =
      'nomeCamada' in this.content
        ? this.content.nomeCamada
        : this.content.nomeMapa;
    return `${this.urlWms}/content/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=content:${layerName}&outputFormat=text/xml; subtype=gml/2.1.2`;
  }

  isCamada(content: any): content is Camadas {
    return 'nomeCamada' in content;
  }

  isMapa(content: any): content is Mapas {
    return 'nomeMapa' in content;
  }

  private combineCamadas() {
    if (this.isMapa(this.content)) {
      const mapaContent = this.content as Mapas;
      this.combinedCamadas = [
        ...((mapaContent.camadas || []) as CamadaComOrdem[]),
        ...((mapaContent.camadasRaster || []) as CamadaRasterComOrdem[]),
      ];
    } else if (this.isCamada(this.content)) {
      const camadaContent = this.content as Camadas | CamadasRaster;
      this.combinedCamadas = [
        {
          ...camadaContent,
          ordemRenderizacao:
            (camadaContent as CamadaCombinada).ordemRenderizacao ?? 0,
        },
      ] as CamadaCombinada[];
    } else {
      this.combinedCamadas = [];
    }
  }

  private refreshContentPreview(): void {
    if (!this.map || !this.content) {
      return;
    }

    this.combineCamadas();
    this.addWMSLayer();
    this.updateLegendUrl();

    if (this.isCamada(this.content)) {
      this.getAtributos();
    } else if (this.isMapa(this.content)) {
      this.getAtributosCamadasDoMapa();
    }

    this.downloadUrl = this.generateDownloadUrl();
    this.owsUrl = this.generateOWSUrl();
  }
}
