import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  ElementRef,
  Renderer2,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTab, MatTabGroup, MatTabLabel } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import Map from 'ol/Map';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import Zoom from 'ol/control/Zoom';
import { fromLonLat, transformExtent } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { OverviewMap } from 'ol/control.js';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import { MapaService } from 'src/app/services/mapa.service';
import { ZoomEnvolopeComponent } from '../../webgis/componentes/zoom-envolope/zoom-envolope.component';
import { BasemapComponent } from '../../webgis/componentes/basemap/basemap.component';
import { CurrentLocationComponent } from '../../webgis/componentes/current-location/current-location.component';
import { HomeComponent } from '../../webgis/componentes/home/home.component';
import { IdentifyComponent } from '../../webgis/componentes/identify/identify.component';
import { AddDadosComponent } from './add-dados/add-dados.component';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import { Camadas } from 'src/app/models/camadas.model';
import { SaveMapaComponent } from './save-mapa/save-mapa.component';
import { AssociateCamadasMapaService } from 'src/app/services/associate.camadas.mapa.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import {
  CamadaComOrdem,
  CamadaRasterComOrdem,
  MapaResponse,
  Mapas,
} from 'src/app/models/mapas.model';
import { ManagerMapasService } from 'src/app/services/manager.mapas.service';
import { CreateLogMapaService } from 'src/app/services/api/create.log.mapa.service';
import { ReCaptchaV3Service } from 'ng-recaptcha';
import { CreateLogCamadaService } from 'src/app/services/api/create.log.camada.service';
import { SaveMapasService } from 'src/app/services/api/save.mapas.service';
import { MatDialog } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { register } from 'ol/proj/proj4';
import proj4 from 'proj4';
import { get as getProjection } from 'ol/proj';
import { MeasureComponent } from '../../webgis/componentes/measure/measure.component';
import { DrawingComponent } from '../../webgis/componentes/drawing/drawing.component';
import { PrintingComponent } from '../../webgis/componentes/printing/printing.component';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { createRasterTileLayer } from 'src/app/services/ol-raster-source.factory';

type ManagedWmsLayer = ImageLayer<ImageWMS> | TileLayer<TileWMS>;

export interface LayerEvent {
  camada: Camadas;
  action: 'add' | 'remove';
}

@Component({
  selector: 'app-maps',
  standalone: true,
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss'],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatTab,
    MatTabGroup,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    BasemapComponent,
    CurrentLocationComponent,
    IdentifyComponent,
    HomeComponent,
    ZoomEnvolopeComponent,
    DragDropModule,
    MeasureComponent,
    DrawingComponent,
    PrintingComponent,
    MatInputModule,
    FormsModule,
  ],
})
export class MapsComponent implements OnInit, AfterViewInit, OnChanges {
  @Output() layerAdded = new EventEmitter<{
    camadas: CamadaComOrdem[] | CamadaRasterComOrdem[];
    action: string;
  }>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  map: Map | undefined;
  urlWms: string | undefined;
  addedLayers: { [key: string]: ManagedWmsLayer } = {};
  camadasVetoriais: CamadaComOrdem[] = [];
  camadasRaster: CamadaRasterComOrdem[] = [];
  addedCamadas: (CamadaComOrdem | CamadaRasterComOrdem)[] = [];
  removedCamadas: (CamadaComOrdem | CamadaRasterComOrdem)[] = [];
  dataSourceContent = new MatTableDataSource<any>();
  isSaveDialogVisible = false;
  isDataWindowVisible = false;
  isSidenavOpened = true;
  mapaAtual: Mapas | null = null;
  address: string = '';
  suggestions: any[] = [];
  private searchSubject = new Subject<string>();
  legendData: { tituloCamada: string; legendUrl: string }[] = [];
  @Output() mapaSalvo = new EventEmitter<Mapas>();

  @ViewChild('measureButton', { read: ElementRef }) measureButton!: ElementRef;
  @ViewChild('measureForm', { read: ElementRef }) measureForm!: ElementRef;
  @ViewChild('drawButton', { read: ElementRef }) drawButton!: ElementRef;
  @ViewChild('drawForm', { read: ElementRef }) drawForm!: ElementRef;
  @ViewChild('printingButton', { read: ElementRef })
  printingButton!: ElementRef;
  @ViewChild('printingForm', { read: ElementRef }) printingForm!: ElementRef;
  isMeasureFormVisible = false;
  isDrawFormVisible = false;
  measureInitialized = false;
  drawInitialized = false;
  isPrintingVisible = false;
  @ViewChild(MeasureComponent) measureComponent!: MeasureComponent;
  @ViewChild(DrawingComponent) drawingComponent!: DrawingComponent;
  @ViewChild(PrintingComponent) printingComponent!: PrintingComponent;
  isEditing = false;
  editedMapName = '';

  constructor(
    private http: HttpClient,
    private mapaService: MapaService,
    private fetchConfigService: FetchConfigsService,
    private associateCamadasMapaService: AssociateCamadasMapaService,
    private managerMapasService: ManagerMapasService,
    private createLogMapaService: CreateLogMapaService,
    private createLogCamadaService: CreateLogCamadaService,
    private recaptchaV3Service: ReCaptchaV3Service,
    private saveMapaService: SaveMapasService,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
  ) {
    proj4.defs(
      'EPSG:31983',
      '+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs',
    );
    register(proj4);

    const projection31983 = getProjection('EPSG:31983');
    if (!projection31983) {
      console.error('Projeção EPSG:31983 não está registrada corretamente.');
    }
  }

  ngOnInit() {
    this.initializeMap();
    this.mapaService.clearMap$.subscribe(() => {
      this.clearMap();
    });

    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((address) => this.searchAddress(address)),
      )
      .subscribe(
        (result: any) => {
          if (Array.isArray(result) && result.length > 0) {
            this.suggestions = result.slice(0, 5);
          } else {
            this.suggestions = [];
          }
        },
        (error) => {
          console.error('Erro na requisição:', error);
          this.suggestions = [];
        },
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['content'] && this.map) {
      this.updateLegendUrl();
    }
    if (changes['mapaAtual']) {
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit() {
    this.dataSourceContent.paginator = this.paginator;
    setTimeout(() => {
      this.inicializarCamadas();
    }, 100);
  }

  private inicializarCamadas() {
    this.mapaAtual = this.managerMapasService.getMapa();

    if (this.mapaAtual && this.mapaService.getMapa()) {
      const combinedCamadas = [
        ...this.mapaAtual.camadas.map((camada) => ({
          ...camada,
          tipo: 'vetorial',
        })),
        ...this.mapaAtual.camadasRaster.map((camadaRaster) => ({
          ...camadaRaster,
          tipo: 'raster',
        })),
      ];

      const sortedCombinedCamadas = combinedCamadas.sort(
        (a, b) => b.ordemRenderizacao - a.ordemRenderizacao,
      );

      for (let i = 0; i < sortedCombinedCamadas.length; i++) {
        const camada = sortedCombinedCamadas[i];
        if (!this.isLayerInAddedCamadas(camada)) {
          this.addCamadaToMap(camada as CamadaComOrdem | CamadaRasterComOrdem);
        }
      }
    }

    this.editedMapName = this.mapaAtual?.tituloMapa || '';
    this.cdr.detectChanges();
  }
  initializeMap() {
    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const latitude = configs.find(
        (config) => config.key === 'LATITUDE',
      )?.value;
      const longitude = configs.find(
        (config) => config.key === 'LONGITUDE',
      )?.value;
      const urlWmsConfig = configs.find(
        (config) => config.key === 'GEOSERVER_URL',
      )?.value;
      this.urlWms = typeof urlWmsConfig === 'string' ? urlWmsConfig : undefined;

      if (latitude && longitude) {
        const basemapLayer = new TileLayer({
          source: new OSM(),
          properties: {
            isBasemap: true,
          },
        });

        this.map = new Map({
          target: 'map',
          layers: [basemapLayer],
          view: new View({
            center: fromLonLat([parseFloat(longitude), parseFloat(latitude)]),
            zoom: 8,
            projection: 'EPSG:3857',
          }),
          controls: [
            new OverviewMap({
              className: 'ol-overviewmap ol-custom-overviewmap',
              layers: [new TileLayer({ source: new OSM() })],
              collapseLabel: '\u00BB',
              label: '\u00AB',
              collapsed: false,
            }),
            new Zoom({
              zoomInTipLabel: 'Zoom In',
              zoomOutTipLabel: 'Zoom Out',
              className: 'custom-ol-zoom',
            }),
          ],
        });

        this.mapaService.setMapa(this.map);

        if (this.mapaAtual && this.mapaAtual.id) {
          this.recaptchaV3Service
            .execute('addDados')
            .subscribe((captchaToken: string) => {
              this.createLogMapaService
                .createLogMapa({ id: this.mapaAtual!.id, captchaToken })
                .subscribe();
            });
        }

        for (const camada of this.addedCamadas) {
          this.addCamadaToMap(camada);
        }

        this.subscribeToCamadas();
      }
    });
  }

  subscribeToCamadas() {
    setTimeout(() => {
      this.associateCamadasMapaService.camadas$.subscribe((camadas) => {
        if (this.map) {
          camadas.forEach((camada, index) => {
            const camadaComOrdem: CamadaComOrdem = {
              ...camada,
              ordemRenderizacao: index,
            };

            if (!this.isLayerInAddedCamadas(camadaComOrdem)) {
              this.addCamadaToMap(camadaComOrdem);
            }

            this.recaptchaV3Service
              .execute('addDados')
              .subscribe((captchaToken: string) => {
                this.createLogCamadaService
                  .createLogCamada({ id: camada.id, captchaToken })
                  .subscribe();
              });
          });
          if (this.mapaAtual?.boundingBoxMapa) {
            setTimeout(() => this.fitMapToExtent(), 100);
          }
          this.cdr.detectChanges();
        }
      });

      this.associateCamadasMapaService.camadasRaster$.subscribe(
        (camadasRaster) => {
          if (this.map) {
            camadasRaster.forEach((camadaRaster, index) => {
              const camadaRasterComOrdem: CamadaRasterComOrdem = {
                ...camadaRaster,
                ordemRenderizacao: index,
              };

              if (!this.isLayerInAddedCamadas(camadaRasterComOrdem)) {
                this.addCamadaToMap(camadaRasterComOrdem);
              }

              this.recaptchaV3Service
                .execute('addDados')
                .subscribe((captchaToken: string) => {
                  this.createLogCamadaService
                    .createLogCamadaRaster({
                      id: camadaRaster.id,
                      captchaToken,
                    })
                    .subscribe();
                });
            });
            if (this.mapaAtual?.boundingBoxMapa) {
              setTimeout(() => this.fitMapToExtent(), 100);
            }
            this.cdr.detectChanges();
          }
        },
      );
    }, 500);
  }

  getAllCamadas(): (CamadaComOrdem | CamadaRasterComOrdem)[] {
    return [...this.camadasVetoriais, ...this.camadasRaster];
  }

  isRasterCamada(camada: CamadaComOrdem | CamadaRasterComOrdem): boolean {
    return !('pacoteConceitual' in camada);
  }

  getFonteDadosCamadaRaster(
    camada: CamadaComOrdem | CamadaRasterComOrdem,
  ): string | undefined {
    return 'fonteDadosCamadaRaster' in camada
      ? camada.fonteDadosCamadaRaster
      : undefined;
  }

  private getLayerKey(camada: CamadaComOrdem | CamadaRasterComOrdem): string {
    return 'fonteDadosCamadaRaster' in camada && camada.fonteDadosCamadaRaster
      ? `content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}`
      : `content:${camada.nomeCamada}`;
  }

  private getWmsSource(layer?: ManagedWmsLayer): ImageWMS | TileWMS | null {
    const source = layer?.getSource();
    if (source instanceof ImageWMS || source instanceof TileWMS) {
      return source;
    }
    return null;
  }

  private createLayer(
    camada: CamadaComOrdem | CamadaRasterComOrdem,
  ): ManagedWmsLayer {
    const layerKey = this.getLayerKey(camada);

    if ('fonteDadosCamadaRaster' in camada && camada.fonteDadosCamadaRaster) {
      return createRasterTileLayer(layerKey, camada.tituloCamada, {
        zIndex: 1000 - camada.ordemRenderizacao,
      });
    }

    const wmsLayer = new ImageLayer({
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
    wmsLayer.set('titulo', camada.tituloCamada);
    return wmsLayer;
  }

  addCamadaToMap(camada: CamadaComOrdem | CamadaRasterComOrdem) {
    const mapa = this.mapaService.getMapa();
    if (!mapa) {
      console.warn('Mapa não foi inicializado ainda.');
      return;
    }

    const layerKey = this.getLayerKey(camada);

    if (!this.addedLayers[layerKey]) {
      const wmsLayer = this.createLayer(camada);

      mapa.addLayer(wmsLayer);
      this.addedLayers[layerKey] = wmsLayer;

      if ('pacoteConceitual' in camada) {
        this.camadasVetoriais = [
          camada as CamadaComOrdem,
          ...this.camadasVetoriais,
        ];
      } else {
        this.camadasRaster = [
          camada as CamadaRasterComOrdem,
          ...this.camadasRaster,
        ];
      }

      this.addedCamadas = [camada, ...this.addedCamadas];
      this.updateRenderOrder();
      this.dataSourceContent.data = [...this.addedCamadas];
      this.updateLegendUrl();

      this.cdr.detectChanges();
    }
  }

  removeCamadaFromMap(camada: CamadaComOrdem | CamadaRasterComOrdem) {
    const mapa = this.mapaService.getMapa();

    const layerKey = this.getLayerKey(camada);

    const layerToRemove = this.addedLayers[layerKey];

    if (layerToRemove) {
      mapa?.removeLayer(layerToRemove);

      if ('pacoteConceitual' in camada) {
        this.camadasVetoriais = this.camadasVetoriais.filter(
          (c) => c.id !== camada.id,
        );
      } else {
        this.camadasRaster = this.camadasRaster.filter(
          (c) => c.id !== camada.id,
        );
      }

      this.addedCamadas = this.addedCamadas.filter((c) => c.id !== camada.id);

      this.dataSourceContent.data = this.addedCamadas;

      this.legendData = this.legendData.filter(
        (legend) => legend.tituloCamada !== camada.tituloCamada,
      );

      delete this.addedLayers[layerKey];

      if ('pacoteConceitual' in camada) {
        this.associateCamadasMapaService.removeCamada(camada);
      } else {
        this.associateCamadasMapaService.removeCamadaRaster(camada);
      }

      this.cdr.detectChanges();
    }
  }

  isLayerInAddedCamadas(
    camada: CamadaComOrdem | CamadaRasterComOrdem,
  ): boolean {
    const exists = this.addedCamadas.some((c) => c.id === camada.id);
    return exists;
  }

  onLayerAdded(event: LayerEvent) {
    if (event.action === 'remove') {
      this.removeCamadaFromMap(
        event.camada as CamadaComOrdem | CamadaRasterComOrdem,
      );
    } else if (event.action === 'add') {
      const camadaComOrdem = {
        ...event.camada,
        ordemRenderizacao: this.addedCamadas.length,
      } as CamadaComOrdem | CamadaRasterComOrdem;

      this.addCamadaToMap(camadaComOrdem);
    }
  }

  onTabChange() {
    setTimeout(() => {
      this.map?.updateSize();
    }, 100);
  }

  newMap() {
    this.clearLegend();
    this.clearMap();
  }

  clearMap() {
    if (this.map) {
      const todasAsCamadas = this.map.getLayers().getArray();
      const basemap = todasAsCamadas.find(
        (layer) => layer.get('isBasemap') === true,
      );

      this.map.getLayers().clear();
      if (basemap) {
        this.map.addLayer(basemap);
      }
      this.addedLayers = {};
      this.camadasVetoriais = [];
      this.camadasRaster = [];
      this.mapaAtual = null;
      this.addedCamadas = [];
      this.removedCamadas = [];
      this.dataSourceContent.data = [];
      this.associateCamadasMapaService.clearCamadas();
      this.mapaAtual = null;

      this.cdr.detectChanges();
    }
  }

  showDataWindow() {
    const dialogRef = this.dialog.open(AddDadosComponent, {
      width: '800px',
    });

    dialogRef.componentInstance.layerAdded.subscribe((event: LayerEvent) => {
      this.onLayerAdded(event);
    });

    dialogRef.afterClosed().subscribe((result) => {});
  }

  showSaveDialog() {
    this.addedCamadas.forEach((camada, index) => {
      camada.ordemRenderizacao = index;
    });

    const camadasComOrdem = this.addedCamadas.filter(
      (camada) => camada.tipo === 'vetorial',
    );
    const camadasRasterComOrdem = this.addedCamadas.filter(
      (camada) => camada.tipo !== 'vetorial',
    );

    const dialogRef = this.dialog.open(SaveMapaComponent, {
      width: '400px',
      data: {
        mapa: this.mapaAtual,
        camadas: camadasComOrdem,
        camadasRaster: camadasRasterComOrdem,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.save(result);
      }
    });
  }

  hideSaveDialog() {
    this.isSaveDialogVisible = false;
  }
  save(mapaAtual: Mapas, tituloEditado?: string) {
    const boundingBox3857 = this.getMapBoundingBox();

    const boundingBox31983 = this.convertBoundingBox(
      boundingBox3857,
      'EPSG:3857',
      'EPSG:31983',
    );

    const boundingBoxMapa = {
      minx: boundingBox31983[0],
      miny: boundingBox31983[1],
      maxx: boundingBox31983[2],
      maxy: boundingBox31983[3],
      crs: 'EPSG:31983',
    };

    mapaAtual.boundingBoxMapa = JSON.stringify(boundingBoxMapa);

    this.saveMapaService.saveMapa(mapaAtual).subscribe(
      (response: MapaResponse) => {
        if (response && response.props && response.props['DSC_TITULO']) {
          const mapaConvertido: Mapas = {
            id: response._id.value,
            nomeMapa: response.props.NOM_NOME_MAPA,
            tituloMapa: tituloEditado
              ? tituloEditado
              : response.props.DSC_TITULO,
            descricaoMapa: response.props.DSC_DESCRICAO,
            boundingBoxMapa: response.props.DSC_BOUNDING_BOX,
            nivelCompartilhamento: response.props.NIVEL_COMPATILHAMENTO,
            grupoMapa: response.props.GRUPOS_MAPAS,
            camadas: mapaAtual.camadas,
            camadasRaster: mapaAtual.camadasRaster,
            nivelCompartilhamentoMapa: mapaAtual.nivelCompartilhamentoMapa,
            grupoMapaNome: '',
            temaId: mapaAtual.temaId,
            temaMapaNome: '',
            favorito: false,
            criadoEm: new Date(),
            updatedAt: new Date(),
            usrCriacao: '',
            visivel: false,
            mapaAtivo: false,
            carregamentoDefault: mapaAtual.carregamentoDefault,
          };

          this.mapaAtual = Object.assign({}, mapaConvertido);
          this.mapaSalvo.emit(this.mapaAtual);
          this.editedMapName = this.mapaAtual.tituloMapa;
          this.cdr.detectChanges();
          this.snackBar.open('Mapa Salvo com Sucesso!', '', {
            duration: 3000,
            panelClass: ['success-snackbar'],
          });
          this.cdr.markForCheck();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 0);
        } else {
          console.error('Resposta do servidor é nula ou inválida:', response);
          this.snackBar.open('Erro: Resposta do servidor inválida.', '', {
            duration: 3000,
          });
        }
      },
      (error) => {
        console.error('Erro ao salvar o mapa:', error);
        this.snackBar.open('Erro ao salvar o mapa.', '', { duration: 3000 });
      },
    );
  }

  saveMapData() {
    if (!this.mapaAtual) {
      this.showSaveDialog();
    } else {
      const boundingBox3857 = this.getMapBoundingBox();

      const boundingBox31983 = this.convertBoundingBox(
        boundingBox3857,
        'EPSG:3857',
        'EPSG:31983',
      );

      this.mapaAtual.boundingBoxMapa = boundingBox31983.join(',');
      this.addedCamadas.forEach((camada, index) => {
        camada.ordemRenderizacao = index;
      });

      this.mapaAtual.camadas = this.addedCamadas.filter(
        (camada) => camada.tipo === 'vetorial',
      ) as CamadaComOrdem[];
      this.mapaAtual.camadasRaster = this.addedCamadas.filter(
        (camada) => camada.tipo !== 'vetorial',
      ) as CamadaRasterComOrdem[];

      if (this.mapaAtual.boundingBoxMapa) {
        const tituloEditado = this.editedMapName.trim();
        this.save(this.mapaAtual, tituloEditado);
      } else {
        console.error('Bounding box is undefined');
      }
    }
  }

  enableEdit() {
    if (this.mapaAtual) {
      this.isEditing = true;
      this.editedMapName = this.mapaAtual.tituloMapa;
    }
  }

  disableEdit() {
    this.isEditing = false;
    if (
      this.editedMapName.trim() &&
      this.mapaAtual?.tituloMapa !== this.editedMapName.trim()
    ) {
      if (this.mapaAtual) {
        this.mapaAtual.tituloMapa = this.editedMapName.trim();
        this.cdr.markForCheck();
      }
    }
  }

  toggleSidenav() {
    this.isSidenavOpened = !this.isSidenavOpened;
    setTimeout(() => {
      this.map?.updateSize();
    }, 300);
  }
  updateRenderOrder() {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return;

    this.addedCamadas.forEach((camada) => {
      const layerKey = this.getLayerKey(camada);
      const layer = this.addedLayers[layerKey];
      if (layer) {
        layer.setZIndex(1000 - camada.ordemRenderizacao);
      }
    });

    mapa.renderSync();
  }

  moveCamadaParaCima(index: number, fonteDadosCamadaRaster?: string) {
    if (index > 0) {
      const camadaMovida = this.addedCamadas[index];
      this.addedCamadas[index] = this.addedCamadas[index - 1];
      this.addedCamadas[index - 1] = camadaMovida;

      this.addedCamadas.forEach((camada, idx) => {
        camada.ordemRenderizacao = idx;
      });

      this.addedCamadas.forEach((camada) => {
        let layerKey = `content:${camada.nomeCamada}`;
        if (
          'fonteDadosCamadaRaster' in camada &&
          camada.fonteDadosCamadaRaster
        ) {
          layerKey = `content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}`;
        }
        const layer = this.addedLayers[layerKey];
        if (layer) {
          layer.setZIndex(1000 - camada.ordemRenderizacao);
        }
      });

      this.dataSourceContent.data = [...this.addedCamadas];
      this.mapaService.getMapa()?.render();
      this.cdr.detectChanges();
    }
  }

  moveCamadaParaBaixo(index: number, fonteDadosCamadaRaster?: string) {
    if (index < this.addedCamadas.length - 1) {
      const camadaMovida = this.addedCamadas[index];
      this.addedCamadas[index] = this.addedCamadas[index + 1];
      this.addedCamadas[index + 1] = camadaMovida;

      this.addedCamadas.forEach((camada, idx) => {
        camada.ordemRenderizacao = idx;
      });

      this.addedCamadas.forEach((camada) => {
        let layerKey = `content:${camada.nomeCamada}`;
        if (
          'fonteDadosCamadaRaster' in camada &&
          camada.fonteDadosCamadaRaster
        ) {
          layerKey = `content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}`;
        }
        const layer = this.addedLayers[layerKey];
        if (layer) {
          layer.setZIndex(1000 - camada.ordemRenderizacao);
        }
      });

      this.dataSourceContent.data = [...this.addedCamadas];
      this.mapaService.getMapa()?.render();
      this.cdr.detectChanges();
    }
  }

  drop(event: CdkDragDrop<(CamadaComOrdem | CamadaRasterComOrdem)[]>) {
    moveItemInArray(this.addedCamadas, event.previousIndex, event.currentIndex);

    this.addedCamadas.forEach((camada, idx) => {
      camada.ordemRenderizacao = idx;
    });

    this.addedCamadas.forEach((camada) => {
      let layerKey = `content:${camada.nomeCamada}`;
      if ('fonteDadosCamadaRaster' in camada && camada.fonteDadosCamadaRaster) {
        layerKey = `content:${camada.nomeCamada}_${camada.fonteDadosCamadaRaster}`;
      }
      const layer = this.addedLayers[layerKey];
      if (layer) {
        layer.setZIndex(1000 - camada.ordemRenderizacao);
      }
    });

    this.dataSourceContent.data = [...this.addedCamadas];
    this.mapaService.getMapa()?.render();
    this.cdr.detectChanges();
  }

  updateMapLayersOrder() {
    const mapa = this.mapaService.getMapa();
    if (!mapa) return;

    this.addedCamadas.forEach((camada) => {
      const layerKey = `content:${camada.nomeCamada}`;
      const layer = this.addedLayers[layerKey];
      if (layer) {
        layer.setZIndex(1000 - camada.ordemRenderizacao);
      }
    });

    mapa.render();
  }

  updateCamadasLists(allCamadas: (CamadaComOrdem | CamadaRasterComOrdem)[]) {
    this.camadasVetoriais = allCamadas.filter(
      (camada) => 'pacoteConceitual' in camada,
    ) as CamadaComOrdem[];
    this.camadasRaster = allCamadas.filter(
      (camada) => !('pacoteConceitual' in camada),
    ) as CamadaRasterComOrdem[];
  }

  getThumbnail(layerName: string, fonteDadosCamadaRaster?: string): string {
    let fullLayerName = `content:${layerName}`;
    if (fonteDadosCamadaRaster) {
      fullLayerName += `_${fonteDadosCamadaRaster}`;
    }

    const imageUrl = `${this.urlWms}/content/wms?service=WMS&version=1.1.0&request=GetMap&layers=${fullLayerName}&bbox=315476.5,7691027.0,390465.375,7895713.0&width=40&height=40&srs=EPSG:31983&styles=&format=image/png`;
    return imageUrl;
  }

  getMapBoundingBox(): [number, number, number, number] {
    if (this.map) {
      const view = this.map.getView();
      const extent: [number, number, number, number] = view.calculateExtent(
        this.map.getSize(),
      ) as [number, number, number, number];
      return extent;
    }
    return [0, 0, 0, 0];
  }

  convertBoundingBox(
    extent: [number, number, number, number],
    source: string,
    destination: string,
  ): [number, number, number, number] {
    return transformExtent(extent, source, destination) as [
      number,
      number,
      number,
      number,
    ];
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

        const map = this.mapaService.getMapa();
        if (!map) {
          throw new Error('Map not found');
        }
        map.setView(view);
      } else {
        console.error('Latitude and Longitude configuration not found');
      }
    });
  }

  fitMapToExtent(retryCount = 0) {
    const extent3857 = this.getBoundingBox();
    const map = this.mapaService.getMapa();

    if (!map) {
      return;
    }

    if (extent3857 && extent3857.every((coord) => isFinite(coord))) {
      const view = map.getView();
      const size = map.getSize();

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
            console.error('Invalid zoom calculated');
            this.applyDefaultView();
          }
        } else {
          console.error('Invalid resolution calculated');
          this.applyDefaultView();
        }
      } else {
        console.error('Invalid map size:', size);
        if (retryCount < 5) {
          setTimeout(() => this.fitMapToExtent(retryCount + 1), 1000);
        } else {
          console.error('Max retries reached. Applying default view.');
          this.applyDefaultView();
        }
      }
    } else {
      console.error('Invalid extent:', extent3857);
      this.applyDefaultView();
    }
  }

  applyDefaultView() {
    const map = this.mapaService.getMapa();
    if (!map) {
      return;
    }
    const view = map.getView();
    view.setCenter([0, 0]);
    view.setZoom(2);
  }

  getBoundingBox(): [number, number, number, number] | null {
    if (this.mapaAtual && this.mapaAtual.boundingBoxMapa) {
      try {
        let minx, miny, maxx, maxy;

        if (this.mapaAtual.boundingBoxMapa.trim().startsWith('{')) {
          const boundingBox = JSON.parse(this.mapaAtual.boundingBoxMapa);
          minx = boundingBox.minx;
          miny = boundingBox.miny;
          maxx = boundingBox.maxx;
          maxy = boundingBox.maxy;
        } else {
          const boundingBoxArray = this.mapaAtual.boundingBoxMapa
            .split(',')
            .map(Number);

          if (boundingBoxArray.length !== 4) {
            throw new Error('Bounding box does not contain exactly 4 values.');
          }

          [minx, miny, maxx, maxy] = boundingBoxArray;
        }

        const [transformedMinx, transformedMiny] = proj4(
          'EPSG:31983',
          'EPSG:3857',
          [minx, miny],
        );
        const [transformedMaxx, transformedMaxy] = proj4(
          'EPSG:31983',
          'EPSG:3857',
          [maxx, maxy],
        );

        if (
          isFinite(transformedMinx) &&
          isFinite(transformedMiny) &&
          isFinite(transformedMaxx) &&
          isFinite(transformedMaxy)
        ) {
          const extent3857: [number, number, number, number] = [
            transformedMinx,
            transformedMiny,
            transformedMaxx,
            transformedMaxy,
          ];

          return extent3857;
        } else {
          throw new Error(
            'Transformed bounding box contains non-finite values.',
          );
        }
      } catch (error) {
        console.error('Error parsing or transforming bounding box:', error);
        return null;
      }
    } else {
      console.error('Bounding box mapa is undefined or empty.');
      return null;
    }
  }

  applyDefaultBoundingBox() {
    const map = this.mapaService.getMapa();
    if (!map) {
      return;
    }
    const layers = map.getLayers().getArray();
    const baseLayer = layers.find((layer) => layer instanceof TileLayer);
    if (baseLayer && this.map) {
      const view = this.map.getView();
      const extent = view.calculateExtent(this.map.getSize());
      view.fit(extent, { size: this.map.getSize() });
    }
  }
  toggleMeasureForm() {
    this.resetMeasureComponent();

    if (this.isDrawFormVisible) {
      this.isDataWindowVisible = false;
      this.resetDrawingComponent();
      this.renderer.setStyle(
        this.drawForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.isPrintingVisible) {
      this.isPrintingVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.printingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    this.isMeasureFormVisible = !this.isMeasureFormVisible;

    setTimeout(() => {
      if (this.isMeasureFormVisible && this.measureForm) {
        this.setPositionOfMeasureForm();
        this.renderer.setStyle(
          this.measureForm.nativeElement,
          'visibility',
          'visible',
        );
      } else if (this.measureForm) {
        this.resetMeasureComponent();
        this.renderer.setStyle(
          this.measureForm.nativeElement,
          'visibility',
          'hidden',
        );
      }
    }, 0);
  }

  toggleDrawForm(): void {
    this.resetDrawingComponent();

    if (this.isMeasureFormVisible) {
      this.isMeasureFormVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.measureForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.isPrintingVisible) {
      this.isPrintingVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.printingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    this.isDrawFormVisible = !this.isDrawFormVisible;

    setTimeout(() => {
      if (this.isDrawFormVisible && this.drawForm) {
        this.setPositionOfDrawForm();
        this.renderer.setStyle(
          this.drawForm.nativeElement,
          'visibility',
          'visible',
        );
      } else if (this.drawForm) {
        this.resetDrawingComponent();
        this.renderer.setStyle(
          this.drawForm.nativeElement,
          'visibility',
          'hidden',
        );
      }
    }, 0);
  }

  toggleFormPrinting() {
    if (this.isMeasureFormVisible) {
      this.isMeasureFormVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.measureForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.isDrawFormVisible) {
      this.isDataWindowVisible = false;
      this.resetDrawingComponent();
      this.renderer.setStyle(
        this.drawForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    this.isPrintingVisible = !this.isPrintingVisible;

    if (this.isPrintingVisible) {
      setTimeout(() => {
        this.emitAllLayersToPrint();
        this.sendLayersToPrint();
        this.setPositionOfPrintingForm();
        this.renderer.setStyle(
          this.printingForm.nativeElement,
          'visibility',
          'visible',
        );
      }, 300);
    } else {
      this.renderer.setStyle(
        this.printingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }
  }

  sendLayersToPrint() {
    if (this.printingComponent) {
      const allLayers = [...this.camadasVetoriais, ...this.camadasRaster];
      this.printingComponent.receiveLayers(allLayers);
    }
  }

  resetMeasureComponent(): void {
    if (this.measureComponent) {
      this.measureComponent.drawType = 'Select';
      this.measureComponent.onTypeChange();
    }
  }

  resetDrawingComponent(): void {
    if (this.drawingComponent) {
      this.drawingComponent.drawType = 'Selecione';
      this.drawingComponent.onChangeDrawType({ value: 'Selecione' });
    }
  }

  setPositionOfMeasureForm() {
    if (!this.measureForm) {
      return;
    }

    const buttonRect = this.measureButton.nativeElement.getBoundingClientRect();
    const measureFormElement = this.measureForm.nativeElement;
    const viewportHeight = window.innerHeight;

    const formHeight = measureFormElement.offsetHeight;
    let topPosition = buttonRect.bottom + window.scrollY;

    const verticalOffset = -80;
    topPosition += verticalOffset;

    if (topPosition + formHeight > viewportHeight) {
      topPosition = buttonRect.top - formHeight + window.scrollY;
    }

    this.renderer.setStyle(measureFormElement, 'top', `${topPosition}px`);
    this.renderer.setStyle(
      measureFormElement,
      'left',
      `${buttonRect.left + window.scrollX}px`,
    );
  }

  setPositionOfDrawForm() {
    if (!this.drawForm) {
      return;
    }

    const buttonRect = this.drawButton.nativeElement.getBoundingClientRect();
    const drawFormElement = this.drawForm.nativeElement;
    const viewportHeight = window.innerHeight;

    const formHeight = drawFormElement.offsetHeight;
    let topPosition = buttonRect.bottom + window.scrollY;

    const verticalOffset = -80;
    topPosition += verticalOffset;

    if (topPosition + formHeight > viewportHeight) {
      topPosition = buttonRect.top - formHeight + window.scrollY;
    }

    this.renderer.setStyle(drawFormElement, 'top', `${topPosition}px`);
    this.renderer.setStyle(
      drawFormElement,
      'left',
      `${buttonRect.left + window.scrollX}px`,
    );
  }
  setPositionOfPrintingForm() {
    if (!this.printingForm) {
      return;
    }

    const buttonRect =
      this.printingButton.nativeElement.getBoundingClientRect();
    const printingFormElement = this.printingForm.nativeElement;
    const viewportHeight = window.innerHeight;

    const formHeight = printingFormElement.offsetHeight;
    let topPosition = buttonRect.bottom + window.scrollY;

    const verticalOffset = -80;
    topPosition += verticalOffset;

    if (topPosition + formHeight > viewportHeight) {
      topPosition = buttonRect.top - formHeight + window.scrollY;
    }

    this.renderer.setStyle(printingFormElement, 'top', `${topPosition}px`);
    this.renderer.setStyle(
      printingFormElement,
      'left',
      `${buttonRect.left + window.scrollX}px`,
    );
  }

  emitAllLayersToPrint() {
    this.layerAdded.emit({
      camadas: this.camadasVetoriais,
      action: 'add',
    });

    this.layerAdded.emit({
      camadas: this.camadasRaster,
      action: 'add',
    });
  }
  selectSuggestion(suggestion: any) {
    const lat = suggestion.lat;
    const lon = suggestion.lon;
    this.address = suggestion.display_name;
    this.suggestions = [];
    this.updateMap(lat, lon);
  }
  onKeyup() {
    this.searchSubject.next(this.address);
  }
  searchAddress(address: string) {
    const url = `https://nominatim.openstreetmap.org/search?q=${address}&format=json&addressdetails=1&limit=5&viewbox=-41.5078,-18.5156,-39.6976,-21.3542&bounded=1`;
    return this.http.get(url);
  }

  updateMap(lat: number, lon: number) {
    const map = this.mapaService.getMapa();
    if (!map) {
      return;
    }
    const view = map.getView();
    view.setCenter(fromLonLat([lon, lat]));
    view.setZoom(19);
  }

  public shareConteudo() {
    if (!this.mapaAtual) return;
    const baseURL = `${window.location.protocol}//${window.location.host}/webgis?`;
    const urlParams = new URLSearchParams();
    if ('temaId' in this.mapaAtual)
      urlParams.set('tema', this.mapaAtual.temaId);
    if ('grupoMapa' in this.mapaAtual)
      urlParams.set('grupoConteudo', this.mapaAtual.grupoMapa);
    urlParams.set('conteudo', this.mapaAtual.id);
    this.clipboard.copy(baseURL + urlParams.toString());
    this.snackBar.open('URL Copiada', '', {
      duration: 2000,
    });
  }
  updateLegendUrl(): void {
    if (!this.map) {
      return;
    }
    const resolution = this.map.getView().getResolution();
    this.legendData = [];

    for (const camada of this.addedCamadas) {
      const layerKey = this.getLayerKey(camada);
      const layer = this.addedLayers[layerKey];
      const source = this.getWmsSource(layer);
      if (source) {
        const legendUrl = source.getLegendUrl(resolution);
        if (legendUrl) {
          this.legendData.push({
            tituloCamada: camada.tituloCamada,
            legendUrl,
          });
        }
      }
    }
  }

  onMapaSalvo(mapaSalvo: Mapas) {
    this.mapaAtual = mapaSalvo;
    this.mapaAtual.temaId = mapaSalvo.temaId;
  }
  clearLegend(): void {
    if (this.legendData) {
      this.legendData = [];
    }
    if (this.printingComponent) {
      this.printingComponent.clearLegend();
    }
  }
}
