import {
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  ViewChild,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import Zoom from 'ol/control/Zoom';
import { MapaService } from 'src/app/services/mapa.service';
import { MeasureComponent } from '../measure/measure.component';
import { DrawingComponent } from '../drawing/drawing.component';
import { BasemapComponent } from '../basemap/basemap.component';
import { CurrentLocationComponent } from '../current-location/current-location.component';
import { IdentifyComponent } from '../identify/identify.component';
import { OverviewMap } from 'ol/control.js';
import { fromLonLat } from 'ol/proj';
import { HomeComponent } from '../home/home.component';
import { ZoomEnvolopeComponent } from '../zoom-envolope/zoom-envolope.component';
import { FetchConfigsService } from 'src/app/services/api/fetch.configs.service';
import { MatIconModule } from '@angular/material/icon';
import { NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { PrintingComponent } from '../printing/printing.component';
import XYZ from 'ol/source/XYZ';
import { CortinaCamadasComponent } from '../cortina-camadas/cortina-camadas.component';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { EscalaComponent } from '../escala/escala.component';
import { getPointResolution } from 'ol/proj';
import { AuthenticateService } from 'src/app/services/api/authenticate.service';
import { ThematicLegendOverlayComponent } from '../thematic/legend/thematic-legend-overlay.component';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  standalone: true,
  imports: [
    BasemapComponent,
    CurrentLocationComponent,
    IdentifyComponent,
    HomeComponent,
    ZoomEnvolopeComponent,
    MeasureComponent,
    MatIconModule,
    MatButtonModule,
    NgIf,
    DrawingComponent,
    PrintingComponent,
    CortinaCamadasComponent,
    MatSliderModule,
    FormsModule,
    EscalaComponent,
    ThematicLegendOverlayComponent,
  ],
})
export class MapaComponent implements OnInit, AfterViewInit {
  map: Map | undefined;
  formMeasureVisible: boolean = false;
  formDrawingVisible: boolean = false;
  formPrintingVisible: boolean = false;
  formCortinaVisible: boolean = false;
  private pendingScale: number | null = null;

  @ViewChild('cortinaButton', { read: ElementRef }) cortinaButton!: ElementRef;
  @ViewChild('cortinaForm', { read: ElementRef }) cortinaForm!: ElementRef;
  @ViewChild('measureButton', { read: ElementRef }) measureButton!: ElementRef;
  @ViewChild('measureForm', { read: ElementRef }) measureForm!: ElementRef;
  @ViewChild('drawingButton', { read: ElementRef }) drawingButton!: ElementRef;
  @ViewChild('drawingForm', { read: ElementRef }) drawingForm!: ElementRef;
  @ViewChild('printingButton', { read: ElementRef })
  printingButton!: ElementRef;
  @ViewChild('printingForm', { read: ElementRef }) printingForm!: ElementRef;

  @ViewChild(MeasureComponent) measureComponent!: MeasureComponent;
  @ViewChild(DrawingComponent) drawingComponent!: DrawingComponent;
  @ViewChild(PrintingComponent) printingComponent!: PrintingComponent;
  @ViewChild(CortinaCamadasComponent)
  cortinaComponent!: CortinaCamadasComponent;

  private zoomControl!: Zoom;
  private overviewMapControl!: OverviewMap;

  isSwipeEnabled = false;
  swipeValue: number = 50;
  isDragging = false;

  layers: any[] = [];

  layer1: string = '';
  layer2: string = '';

  constructor(
    private mapaService: MapaService,
    private fetchConfigService: FetchConfigsService,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef,
    private authService: AuthenticateService,
  ) {}

  ngOnInit() {
    this.fetchConfigService.getConfigs().subscribe((configs) => {
      const latitude = configs.find((config) => config.key === 'LATITUDE');
      const longitude = configs.find((config) => config.key === 'LONGITUDE');
      if (latitude && longitude) {
        this.overviewMapControl = new OverviewMap({
          className: 'ol-overviewmap ol-custom-overviewmap',
          layers: [
            (() => {
              const l = new TileLayer({
                source: new XYZ({
                  url: '/tile-proxy/{z}/{x}/{y}.png',
                  crossOrigin: 'anonymous',
                  maxZoom: 19,
                }),
                preload: 1,
              });
              l.set('transition', 0);
              return l;
            })(),
          ],
          collapseLabel: '\u00BB',
          label: '\u00AB',
          collapsed: false,
        });

        this.map = new Map({
          target: 'map',
          layers: [
            (() => {
              const l = new TileLayer({
                source: new XYZ({
                  url: '/tile-proxy/{z}/{x}/{y}.png',
                  crossOrigin: 'anonymous',
                  maxZoom: 19,
                }),
                preload: 1,
              });
              l.set('transition', 0);
              return l;
            })(),
          ],
          view: new View({
            center: fromLonLat([
              parseFloat(longitude.value ?? ''),
              parseFloat(latitude.value ?? ''),
            ]),
            zoom: 8,
            projection: 'EPSG:3857',
          }),
          controls: [
            this.overviewMapControl,
            new Zoom({
              zoomInTipLabel: 'Zoom In',
              zoomOutTipLabel: 'Zoom Out',
              className: 'custom-ol-zoom',
            }),
          ],
        });

        this.setupCustomMouseWheelZoom();

        this.mapaService.setMapa(this.map);
      }
    });
  }
  ngAfterViewInit(): void {
    this.cdRef.detectChanges();

    if (!this.printingComponent) {
      console.error('PrintingComponent não foi inicializado corretamente.');
    }

    this.cortinaComponent.layersChanged.subscribe(({ layer1, layer2 }) => {
      this.layer1 = layer1;
      this.layer2 = layer2;
    });
  }

  private setupCustomMouseWheelZoom(): void {
    if (!this.map) return;

    this.map.getViewport().addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();

        const delta = event.deltaY;

        if (delta < 0) {
          this.performCustomZoom('in', event);
        } else if (delta > 0) {
          this.performCustomZoom('out', event);
        }
      },
      { passive: false },
    );
  }

  private performCustomZoom(direction: 'in' | 'out', event: WheelEvent): void {
    // Usar a escala pendente se existir, caso contrário usar a escala atual
    const baseScale = this.pendingScale ?? this.mapaService.getCurrentScale();
    const SCALE_STEP = 1000;

    let newScale: number;

    if (direction === 'in') {
      newScale = Math.max(baseScale - SCALE_STEP, SCALE_STEP);
    } else {
      newScale = baseScale + SCALE_STEP;
    }

    // Atualizar a escala pendente imediatamente
    this.pendingScale = newScale;

    this.mapaService.setManualZoom(true);

    this.applyScaleToMap(newScale, event);
  }

  private applyScaleToMap(targetScale: number, event: WheelEvent): void {
    if (!this.map) return;

    const view = this.map.getView();
    const projection = view.getProjection();
    const currentCenter = view.getCenter();

    if (!currentCenter) return;

    try {
      const DPI = 96;
      const INCHES_PER_METER = 39.37008;

      let targetResolution = targetScale / (DPI * INCHES_PER_METER);

      if (projection.getUnits() === 'degrees') {
        const currentPointResolution = getPointResolution(
          projection,
          1,
          currentCenter,
        );
        targetResolution = targetResolution / currentPointResolution;
      }

      // Obter a coordenada do mouse no mapa usando helpers do OL (tolera deslocamentos/padding)
      const pixel = this.map.getEventPixel(event);
      const mouseCoordinate = pixel
        ? this.map.getCoordinateFromPixel(pixel)
        : null;

      if (!mouseCoordinate) {
        // Se não conseguir obter a coordenada do mouse, faz zoom no centro atual
        view.animate(
          {
            resolution: targetResolution,
            duration: 150,
          },
          () => {
            // Callback após a animação terminar
            this.mapaService.updateScale(targetScale);
            this.mapaService.resetManualZoom();
            this.pendingScale = null; // Limpar a escala pendente
          },
        );
        return;
      }

      // Calcular o novo centro para manter o ponto do mouse fixo
      const currentResolution = view.getResolution();
      if (!currentResolution) return;

      const resolutionRatio = targetResolution / currentResolution;

      const deltaX = mouseCoordinate[0] - currentCenter[0];
      const deltaY = mouseCoordinate[1] - currentCenter[1];

      const newCenter = [
        currentCenter[0] + deltaX * (1 - resolutionRatio),
        currentCenter[1] + deltaY * (1 - resolutionRatio),
      ];

      // Animar o zoom mantendo o ponto do mouse fixo
      view.animate(
        {
          resolution: targetResolution,
          center: newCenter,
          duration: 150,
        },
        () => {
          // Callback após a animação terminar - atualiza a escala e reseta o flag de zoom manual
          this.mapaService.updateScale(targetScale);
          this.mapaService.resetManualZoom();
          this.pendingScale = null; // Limpar a escala pendente
        },
      );
    } catch (error) {
      console.error('Erro ao aplicar zoom do mouse:', error);
      this.mapaService.resetManualZoom();
      this.pendingScale = null; // Limpar a escala pendente em caso de erro
    }
  }

  toogleFormCortina() {
    this.resetCortinaComponent();

    if (this.formMeasureVisible) {
      this.formMeasureVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.measureForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formDrawingVisible) {
      this.formDrawingVisible = false;
      this.resetDrawingComponent();
      this.renderer.setStyle(
        this.drawingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formPrintingVisible) {
      this.formPrintingVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.printingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    this.formCortinaVisible = !this.formCortinaVisible;

    setTimeout(() => {
      if (this.formCortinaVisible && this.cortinaForm) {
        this.clearFormInlinePosition(this.cortinaForm.nativeElement);
        this.renderer.setStyle(
          this.cortinaForm.nativeElement,
          'visibility',
          'visible',
        );
        this.mapaService.setSwipeEnabled(true);
        this.layers = this.cortinaComponent.loadAvailableLayers();
        this.overviewMapControl.setCollapsed(true);
      } else if (this.measureForm) {
        this.resetCortinaComponent();
        this.renderer.setStyle(
          this.cortinaForm.nativeElement,
          'visibility',
          'hidden',
        );
        this.mapaService.setSwipeEnabled(false);
      }
    }, 0);
  }

  toggleFormMeasure() {
    this.resetMeasureComponent();

    if (this.formCortinaVisible) {
      this.formDrawingVisible = false;
      this.resetCortinaComponent();
      this.renderer.setStyle(
        this.cortinaForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formDrawingVisible) {
      this.formDrawingVisible = false;
      this.resetDrawingComponent();
      this.renderer.setStyle(
        this.drawingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formPrintingVisible) {
      this.formPrintingVisible = false;
      this.renderer.setStyle(
        this.printingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    this.formMeasureVisible = !this.formMeasureVisible;

    setTimeout(() => {
      if (this.formMeasureVisible && this.measureForm) {
        this.clearFormInlinePosition(this.measureForm.nativeElement);
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

  toggleFormDrawing(): void {
    this.resetDrawingComponent();

    if (this.formCortinaVisible) {
      this.formDrawingVisible = false;
      this.resetCortinaComponent();
      this.renderer.setStyle(
        this.cortinaForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formMeasureVisible) {
      this.formMeasureVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.measureForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formPrintingVisible) {
      this.formPrintingVisible = false;
      this.renderer.setStyle(
        this.printingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    this.formDrawingVisible = !this.formDrawingVisible;

    setTimeout(() => {
      if (this.formDrawingVisible && this.drawingForm) {
        this.clearFormInlinePosition(this.drawingForm.nativeElement);
        this.renderer.setStyle(
          this.drawingForm.nativeElement,
          'visibility',
          'visible',
        );
      } else if (this.drawingForm) {
        this.resetDrawingComponent();
        this.renderer.setStyle(
          this.drawingForm.nativeElement,
          'visibility',
          'hidden',
        );
      }
    }, 0);
  }

  toggleFormPrinting() {
    if (this.formCortinaVisible) {
      this.formDrawingVisible = false;
      this.resetCortinaComponent();
      this.renderer.setStyle(
        this.cortinaForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formDrawingVisible) {
      this.formDrawingVisible = false;
      this.resetDrawingComponent();
      this.renderer.setStyle(
        this.drawingForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    if (this.formMeasureVisible) {
      this.formMeasureVisible = false;
      this.resetMeasureComponent();
      this.renderer.setStyle(
        this.measureForm.nativeElement,
        'visibility',
        'hidden',
      );
    }

    this.formPrintingVisible = !this.formPrintingVisible;

    setTimeout(() => {
      if (this.formPrintingVisible && this.printingForm) {
        this.clearFormInlinePosition(this.printingForm.nativeElement);
        this.renderer.setStyle(
          this.printingForm.nativeElement,
          'visibility',
          'visible',
        );
      }
    }, 0);
  }

  resetCortinaComponent(): void {
    if (this.cortinaComponent) {
      this.cortinaComponent.layer1 = '';
      this.cortinaComponent.layer2 = '';
      this.cortinaComponent.removeSwipe();
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

  private clearFormInlinePosition(el: HTMLElement): void {
    this.renderer.removeStyle(el, 'top');
    this.renderer.removeStyle(el, 'left');
  }

  adjustCortinaFormPosition() {
    if (!this.cortinaForm) {
      return;
    }

    const buttonRect = this.cortinaButton.nativeElement.getBoundingClientRect();
    const cortinaFormElement = this.cortinaForm.nativeElement;

    const formHeight = cortinaFormElement.offsetHeight;
    const topPosition = buttonRect.top - formHeight - 10;

    this.renderer.setStyle(cortinaFormElement, 'top', `${topPosition}px`);
    this.renderer.setStyle(
      cortinaFormElement,
      'left',
      `${buttonRect.left + buttonRect.width / 2}px`,
    );
  }

  adjustMeasureFormPosition() {
    if (!this.measureForm) {
      return;
    }

    const buttonRect = this.measureButton.nativeElement.getBoundingClientRect();
    const measureFormElement = this.measureForm.nativeElement;

    const formHeight = measureFormElement.offsetHeight;
    const topPosition = buttonRect.top - formHeight - 10;

    this.renderer.setStyle(measureFormElement, 'top', `${topPosition}px`);
    this.renderer.setStyle(
      measureFormElement,
      'left',
      `${buttonRect.left + buttonRect.width / 2}px`,
    );
  }

  adjustDrawingFormPosition() {
    if (!this.drawingForm) {
      return;
    }

    const buttonRect = this.drawingButton.nativeElement.getBoundingClientRect();
    const drawingFormElement = this.drawingForm.nativeElement;

    const formHeight = drawingFormElement.offsetHeight;
    const topPosition = buttonRect.top - formHeight - 10;

    this.renderer.setStyle(drawingFormElement, 'top', `${topPosition}px`);
    this.renderer.setStyle(
      drawingFormElement,
      'left',
      `${buttonRect.left + buttonRect.width / 2}px`,
    );
  }

  adjustPrintingFormPosition() {
    if (!this.printingForm) {
      return;
    }

    const buttonRect =
      this.printingButton.nativeElement.getBoundingClientRect();
    const printingFormElement = this.printingForm.nativeElement;

    const formHeight = printingFormElement.offsetHeight;
    const topPosition = buttonRect.top - formHeight - 10;

    this.renderer.setStyle(printingFormElement, 'top', `${topPosition}px`);
    this.renderer.setStyle(
      printingFormElement,
      'left',
      `${buttonRect.left + buttonRect.width / 2}px`,
    );
  }

  // Controle de visibilidade do componente de preferências
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  onSwipeValueChange(event: any) {
    this.swipeValue = event.target.value;
    if (this.cortinaComponent) {
      this.cortinaComponent.updateSwipeValue(this.swipeValue);
    }
  }

  onDividerMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    e.preventDefault();
  }

  onDividerTouchStart(e: TouchEvent): void {
    this.isDragging = true;
    e.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    this.applySwipeFromClientX(e.clientX);
  }

  @HostListener('document:mouseup')
  onDocumentMouseUp(): void {
    this.isDragging = false;
  }

  @HostListener('document:touchmove', ['$event'])
  onDocumentTouchMove(e: TouchEvent): void {
    if (!this.isDragging) return;
    this.applySwipeFromClientX(e.touches[0].clientX);
  }

  @HostListener('document:touchend')
  onDocumentTouchEnd(): void {
    this.isDragging = false;
  }

  private applySwipeFromClientX(clientX: number): void {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    const rect = mapEl.getBoundingClientRect();
    const pct = Math.max(
      2,
      Math.min(98, ((clientX - rect.left) / rect.width) * 100),
    );
    this.swipeValue = pct;
    if (this.cortinaComponent) {
      this.cortinaComponent.updateSwipeValue(pct);
    }
  }

  getLayerTitle(id: string): string {
    const layer = this.layers.find((l) => l.get('id') === id);
    return layer ? layer.get('titulo') : '';
  }
}
