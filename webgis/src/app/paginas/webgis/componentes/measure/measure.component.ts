import { Component, OnInit } from '@angular/core';
import { Draw, Modify } from 'ol/interaction';
import { Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import {
  Style,
  Fill,
  Stroke,
  Text,
  Circle as CircleStyle,
  RegularShape,
} from 'ol/style';
import { Geometry, LineString, Point, Polygon } from 'ol/geom';
import { MapaService } from 'src/app/services/mapa.service';
import { Feature, Map } from 'ol';
import { getArea, getLength } from 'ol/sphere';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgIf } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MatTooltip } from '@angular/material/tooltip';
import {
  MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';

@Component({
  selector: 'app-measure',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatCheckboxModule,
    MatTooltip,
    MatSlideToggleModule,
  ],
  providers: [
    {
      provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS,
      useValue: {
        color: '#4DA9E7',
      },
    },
  ],
  templateUrl: './measure.component.html',
  styleUrls: ['./measure.component.scss'],
})
export class MeasureComponent implements OnInit {
  draw!: Draw;
  source!: VectorSource;
  vectorLayer!: VectorLayer<VectorSource>;
  modify!: Modify;
  drawType:
    | 'Select'
    | 'Point'
    | 'LineString'
    | 'Polygon'
    | 'Circle'
    | 'MultiPoint'
    | 'MultiLineString'
    | 'MultiPolygon' = 'Select';
  showSegments: boolean = true;
  clearPrevious: boolean = false;
  private map$!: Observable<Map>;
  private mapSubscription!: Subscription;

  constructor(private mapaService: MapaService) {}

  ngOnInit(): void {
    this.map$ = this.mapaService
      .getMapaObservable()
      .pipe(filter((map): map is Map => map !== null));
    this.mapSubscription = this.map$.subscribe((map) => {
      this.initializeMap(map);

      const layers = map.getLayers();
      const handleLayerAdd = () => {
        layers.un('add', handleLayerAdd);
        this.bringVectorLayerToTop(map);
        layers.on('add', handleLayerAdd);
      };

      layers.on('add', handleLayerAdd);
    });
  }

  bringVectorLayerToTop(map: Map): void {
    map.removeLayer(this.vectorLayer);
    map.addLayer(this.vectorLayer);
  }

  ngOnDestroy(): void {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }

  initializeMap(map: Map): void {
    this.source = new VectorSource();
    this.modify = new Modify({ source: this.source });

    this.vectorLayer = new VectorLayer<VectorSource>({
      source: this.source,
      style: (feature) =>
        this.styleFunction(
          feature as Feature<Geometry>,
          this.showSegments,
          this.drawType,
          '',
        ),
    });

    map.addLayer(this.vectorLayer);
    map.addInteraction(this.modify);
  }
  addInteraction(map: Map): void {
    if (this.draw) {
      map.removeInteraction(this.draw);
    }

    if (this.drawType === 'Select') {
      return;
    }

    const activeTip = `Click to continue drawing the ${
      this.drawType === 'Polygon' ? 'polygon' : 'line'
    }`;
    const idleTip = 'Click to start measuring';
    let tip = idleTip;

    this.draw = new Draw({
      source: this.source,
      type: this.drawType,
      style: (feature) =>
        this.styleFunction(
          feature as Feature<Geometry>,
          this.showSegments,
          this.drawType,
          tip,
        ),
    });

    this.draw.on('drawstart', () => {
      if (this.clearPrevious) {
        this.source.clear();
      }
      this.modify.setActive(false);
      tip = activeTip;
    });

    this.draw.on('drawend', (event) => {
      const feature = event.feature;
      feature.setStyle(
        this.styleFunction(feature, this.showSegments, this.drawType),
      );
      this.modify.setActive(true);
      tip = idleTip;
      this.vectorLayer.changed();
    });

    this.modify.setActive(true);
    map.addInteraction(this.draw);
  }

  styleFunction(
    feature: Feature<Geometry>,
    segments: boolean,
    drawType: string,
    tip: string = '',
  ): Style[] {
    const styles: Style[] = [];
    const geometry = feature.getGeometry();

    if (!geometry) {
      return styles;
    }

    const type = geometry.getType();
    let point: Point | undefined;
    let label: string | undefined;
    let line: LineString | undefined;

    const style = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.5)',
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 1)',
        lineDash: [10, 10],
        width: 2,
      }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 1)',
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
      }),
    });

    const labelStyle = new Style({
      text: new Text({
        font: '14px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        padding: [3, 3, 3, 3],
        textBaseline: 'bottom',
        offsetY: -15,
      }),
      image: new RegularShape({
        radius: 8,
        points: 3,
        angle: Math.PI,
        displacement: [0, 10],
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
      }),
    });

    const segmentStyle = new Style({
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.4)',
        }),
        padding: [2, 2, 2, 2],
        textBaseline: 'bottom',
        offsetY: -12,
      }),
      image: new RegularShape({
        radius: 6,
        points: 3,
        angle: Math.PI,
        displacement: [0, 8],
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0.4)',
        }),
      }),
    });

    const formatLength = (line: LineString) => {
      const length = getLength(line);
      return length > 100
        ? `${Math.round((length / 1000) * 100) / 100} km`
        : `${Math.round(length * 100) / 100} m`;
    };

    const formatArea = (polygon: Polygon) => {
      const area = getArea(polygon);
      return area > 10000
        ? `${Math.round((area / 1000000) * 100) / 100} km²`
        : `${Math.round(area * 100) / 100} m²`;
    };

    if (drawType === type) {
      styles.push(style);
      if (type === 'Polygon' && geometry instanceof Polygon) {
        point = geometry.getInteriorPoint();
        label = formatArea(geometry);
        line = new LineString(geometry.getCoordinates()[0]);
      } else if (type === 'LineString' && geometry instanceof LineString) {
        point = new Point(geometry.getLastCoordinate());
        label = formatLength(geometry);
        line = geometry;
      }
    }

    if (segments && line) {
      line.forEachSegment((a, b) => {
        const segment = new LineString([a, b]);
        const segmentLabel = formatLength(segment);
        const segmentPoint = new Point(segment.getCoordinateAt(0.5));
        segmentStyle.setGeometry(segmentPoint);

        const text = segmentStyle.getText();
        if (text) {
          text.setText(segmentLabel);
        }

        styles.push(segmentStyle);
      });
    }

    if (label && point) {
      labelStyle.setGeometry(point);
      const text = labelStyle.getText();
      if (text) {
        text.setText(label);
      }
      styles.push(labelStyle);
    }

    if (tip && type === 'Point') {
      const tipStyle = new Style({
        text: new Text({
          font: '12px Calibri,sans-serif',
          fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
          }),
          backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
          }),
          padding: [2, 2, 2, 2],
          textAlign: 'left',
          offsetX: 15,
        }),
      });
      const text = tipStyle.getText();
      if (text) {
        text.setText(tip);
      }
      tipStyle.setGeometry(geometry);
      styles.push(tipStyle);
    }

    return styles;
  }

  onTypeChange(): void {
    this.map$.subscribe((map) => {
      if (map) {
        if (this.draw) {
          map.removeInteraction(this.draw);
        }
        this.addInteraction(map);
      }
    });
  }

  onSegmentChange(): void {
    this.vectorLayer.changed();
  }

  clearAllSegments(): void {
    this.source.clear();
  }
}
