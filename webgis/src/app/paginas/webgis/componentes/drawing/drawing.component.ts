import { Component, OnInit, OnDestroy } from '@angular/core';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import { Draw, Modify, Snap } from 'ol/interaction';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { LineString, SimpleGeometry } from 'ol/geom';
import { MapaService } from 'src/app/services/mapa.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { GeometryFunction, SketchCoordType } from 'ol/interaction/Draw';
import { Observable, Subscription } from 'rxjs';
import { Map } from 'ol';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-drawing',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatInputModule,
    MatSlideToggleModule,
    MatOptionModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#4DA9E7',
      },
    },
  ],
  templateUrl: './drawing.component.html',
  styleUrls: ['./drawing.component.scss'],
})
export class DrawingComponent implements OnInit, OnDestroy {
  vectorLayer!: VectorLayer<VectorSource>;
  draw!: Draw;
  snap!: Snap;
  source = new VectorSource({ wrapX: false });
  lineWidth = 2;
  lineColor = '#ffcc33';
  fillColor = '#ffffff';
  fillOpacity = 1.0;
  drawType:
    | 'Selecione'
    | 'Point'
    | 'LineString'
    | 'Polygon'
    | 'Circle'
    | 'Arrow' = 'Selecione';
  freehand = false;
  clearPrevious = false;
  lineWidthControl = new FormControl(2);

  private map$!: Observable<Map>;
  private mapSubscription!: Subscription;

  constructor(private mapaService: MapaService) {}

  ngOnInit() {
    this.map$ = this.mapaService
      .getMapaObservable()
      .pipe(filter((map): map is Map => map !== null));

    this.mapSubscription = this.map$.subscribe((map) => {
      this.initializeMap(map);
      this.addInteractions(map);

      const layers = map.getLayers();
      const handleLayerAdd = () => {
        layers.un('add', handleLayerAdd);
        this.bringVectorLayerToTop(map);
        layers.on('add', handleLayerAdd);
      };

      layers.on('add', handleLayerAdd);
    });

    this.lineWidthControl.valueChanges.subscribe((value) => {
      this.lineWidth = value || 2;
      this.updateStyle();
    });
  }

  ngOnDestroy(): void {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }

  initializeMap(map: Map) {
    this.vectorLayer = new VectorLayer({
      source: this.source,
      style: this.getDefaultStyle(),
    });

    map.addLayer(this.vectorLayer);
  }

  onChangeDrawType(event: any) {
    this.drawType = event.value;
    this.updateDrawInteraction();
  }

  bringVectorLayerToTop(map: Map): void {
    map.removeLayer(this.vectorLayer);
    map.addLayer(this.vectorLayer);
  }

  addInteractions(map: Map) {
    this.updateDrawInteraction();
    const modify = new Modify({ source: this.source });
    map.addInteraction(modify);

    this.snap = new Snap({ source: this.source });
    map.addInteraction(this.snap);
  }

  updateDrawInteraction() {
    const map = this.mapaService.getMapa();
    if (!map) {
      console.error('Mapa não está disponível.');
      return;
    }

    if (this.draw) {
      map.removeInteraction(this.draw);
    }

    if (this.drawType === 'Selecione') {
      return;
    }

    let geometryFunction: GeometryFunction | undefined;
    let drawType: 'Point' | 'LineString' | 'Polygon' | 'Circle';

    if (this.drawType === 'Arrow') {
      drawType = 'LineString';
      geometryFunction = this.arrowGeometryFunction.bind(this);
    } else {
      drawType = this.drawType;
      geometryFunction = undefined;
    }

    this.draw = new Draw({
      source: this.source,
      type: drawType,
      freehand: this.freehand,
      geometryFunction: geometryFunction,
    });

    this.draw.on('drawstart', () => {
      if (this.clearPrevious) {
        this.source.clear();
      }
    });

    map.addInteraction(this.draw);
  }

  clearAllDrawings() {
    this.source.clear();
  }

  onClearPreviousChange() {
    if (this.clearPrevious) {
      this.source.clear();
    }
  }

  updateStyle() {
    if (this.vectorLayer) {
      this.vectorLayer.setStyle(this.getDefaultStyle());
    } else {
      console.error('vectorLayer is not initialized');
    }
  }

  getDefaultStyle() {
    return new Style({
      fill: new Fill({
        color: this.hexToRgba(this.fillColor, this.fillOpacity),
      }),
      stroke: new Stroke({
        color: this.lineColor,
        width: this.lineWidth,
      }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: this.lineColor,
        }),
      }),
    });
  }

  arrowGeometryFunction(
    coordinates: SketchCoordType,
    geometry?: SimpleGeometry,
  ): SimpleGeometry {
    const start = coordinates[0] as number[];
    const end = coordinates[coordinates.length - 1] as number[];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);

    const arrowLength = 10000;

    const point1 = [
      end[0] - arrowLength * Math.cos(rotation - Math.PI / 6),
      end[1] - arrowLength * Math.sin(rotation - Math.PI / 6),
    ];
    const point2 = [
      end[0] - arrowLength * Math.cos(rotation + Math.PI / 6),
      end[1] - arrowLength * Math.sin(rotation + Math.PI / 6),
    ];

    if (!geometry || !(geometry instanceof LineString)) {
      geometry = new LineString([start, end, point1, end, point2, end]);
    } else {
      geometry.setCoordinates([start, end, point1, end, point2, end]);
    }

    return geometry;
  }

  onColorChange(event: Event, type: 'line' | 'fill'): void {
    const input = event.target as HTMLInputElement;
    const color = input?.value || '';

    if (type === 'line') {
      this.lineColor = color;
    } else if (type === 'fill') {
      this.fillColor = color;
    }

    this.updateStyle();
  }

  hexToRgba(hex: string, opacity: number): string {
    let r = 0,
      g = 0,
      b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    return `rgba(${r},${g},${b},${opacity})`;
  }
}
