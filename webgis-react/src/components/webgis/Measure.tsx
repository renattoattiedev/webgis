// GEO Portal — Measure (portado de measure.component.ts do Angular)
// Medição de distância (LineString) e área (Polygon) com rótulos no mapa.
import { useEffect, useRef, useState } from 'react';
import type { Feature } from 'ol';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Draw, Modify } from 'ol/interaction';
import {
  Circle as CircleStyle,
  Fill,
  RegularShape,
  Stroke,
  Style,
  Text,
} from 'ol/style';
import { LineString, Point, Polygon, type Geometry } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import { useMapa } from '../../contexts/MapaContext';
import './Measure.css';

type MeasureType = 'Select' | 'Point' | 'LineString' | 'Polygon';

const TYPES: MeasureType[] = ['Select', 'LineString', 'Polygon', 'Point'];

function formatLength(line: LineString): string {
  const length = getLength(line);
  return length > 100
    ? `${Math.round((length / 1000) * 100) / 100} km`
    : `${Math.round(length * 100) / 100} m`;
}

function formatArea(polygon: Polygon): string {
  const area = getArea(polygon);
  return area > 10000
    ? `${Math.round((area / 1000000) * 100) / 100} km²`
    : `${Math.round(area * 100) / 100} m²`;
}

function styleFunction(
  feature: Feature<Geometry>,
  segments: boolean,
  drawType: MeasureType,
  tip: string = '',
): Style[] {
  const styles: Style[] = [];
  const geometry = feature.getGeometry();
  if (!geometry) return styles;

  const type = geometry.getType();
  let point: Point | undefined;
  let label: string | undefined;
  let line: LineString | undefined;

  const style = new Style({
    fill: new Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 1)',
      lineDash: [10, 10],
      width: 2,
    }),
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({ color: 'rgba(0, 0, 0, 1)' }),
      fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
    }),
  });

  const labelStyle = new Style({
    text: new Text({
      font: '14px Calibri,sans-serif',
      fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
      backgroundFill: new Fill({ color: 'rgba(0, 0, 0, 0.7)' }),
      padding: [3, 3, 3, 3],
      textBaseline: 'bottom',
      offsetY: -15,
    }),
    image: new RegularShape({
      radius: 8,
      points: 3,
      angle: Math.PI,
      displacement: [0, 10],
      fill: new Fill({ color: 'rgba(0, 0, 0, 0.7)' }),
    }),
  });

  const segmentStyle = new Style({
    text: new Text({
      font: '12px Calibri,sans-serif',
      fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
      backgroundFill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' }),
      padding: [2, 2, 2, 2],
      textBaseline: 'bottom',
      offsetY: -12,
    }),
    image: new RegularShape({
      radius: 6,
      points: 3,
      angle: Math.PI,
      displacement: [0, 8],
      fill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' }),
    }),
  });

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
      segmentStyle.setGeometry(new Point(segment.getCoordinateAt(0.5)));
      segmentStyle.getText()?.setText(segmentLabel);
      styles.push(segmentStyle);
    });
  }

  if (label && point) {
    labelStyle.setGeometry(point);
    labelStyle.getText()?.setText(label);
    styles.push(labelStyle);
  }

  if (tip && type === 'Point') {
    const tipStyle = new Style({
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
        backgroundFill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' }),
        padding: [2, 2, 2, 2],
        textAlign: 'left',
        offsetX: 15,
      }),
    });
    tipStyle.getText()?.setText(tip);
    tipStyle.setGeometry(geometry);
    styles.push(tipStyle);
  }

  return styles;
}

export default function Measure() {
  const { mapa } = useMapa();
  const sourceRef = useRef(new VectorSource());
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const modifyRef = useRef<Modify | null>(null);
  const drawRef = useRef<Draw | null>(null);

  const [drawType, setDrawType] = useState<MeasureType>('Select');
  const [showSegments, setShowSegments] = useState(true);
  const [clearPrevious, setClearPrevious] = useState(false);

  useEffect(() => {
    if (!mapa) return;
    const source = sourceRef.current;

    const modify = new Modify({ source });
    modifyRef.current = modify;

    const vectorLayer = new VectorLayer<VectorSource>({
      source,
      style: (feature) =>
        styleFunction(feature as Feature<Geometry>, showSegments, drawType),
    });
    vectorLayerRef.current = vectorLayer;

    mapa.addLayer(vectorLayer);
    mapa.addInteraction(modify);

    return () => {
      mapa.removeLayer(vectorLayer);
      mapa.removeInteraction(modify);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa]);

  // (re)adiciona a interação de draw sempre que mudar o tipo
  useEffect(() => {
    if (!mapa) return;
    if (drawRef.current) {
      mapa.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    if (drawType === 'Select') {
      modifyRef.current?.setActive(true);
      return;
    }

    let tip = 'Click to start measuring';
    const draw = new Draw({
      source: sourceRef.current,
      type: drawType,
      style: (feature) =>
        styleFunction(feature as Feature<Geometry>, showSegments, drawType, tip),
    });

    draw.on('drawstart', () => {
      if (clearPrevious) sourceRef.current.clear();
      modifyRef.current?.setActive(false);
      tip =
        drawType === 'Polygon'
          ? 'Click to continue drawing the polygon'
          : 'Click to continue drawing the line';
    });

    draw.on('drawend', (event) => {
      const feature = event.feature;
      feature.setStyle(
        styleFunction(feature as Feature<Geometry>, showSegments, drawType),
      );
      modifyRef.current?.setActive(true);
      tip = 'Click to start measuring';
      vectorLayerRef.current?.changed();
    });

    drawRef.current = draw;
    mapa.addInteraction(draw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawType, showSegments, clearPrevious, mapa]);

  function onSegmentChange() {
    vectorLayerRef.current?.changed();
  }

  function clearAll() {
    sourceRef.current.clear();
  }

  return (
    <div className="measure-panel">
      <div className="measure-header">Medir</div>
      <div className="measure-body">
        <div className="measure-row">
          <label>Tipo</label>
          <select value={drawType} onChange={(e) => setDrawType(e.target.value as MeasureType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="measure-row measure-check">
          <label>
            <input
              type="checkbox"
              checked={showSegments}
              onChange={(e) => {
                setShowSegments(e.target.checked);
                onSegmentChange();
              }}
            />
            Mostrar segmentos
          </label>
        </div>
        <div className="measure-row measure-check">
          <label>
            <input
              type="checkbox"
              checked={clearPrevious}
              onChange={(e) => setClearPrevious(e.target.checked)}
            />
            Limpar medições anteriores
          </label>
        </div>
        <div className="measure-actions">
          <button type="button" className="measure-clear" onClick={clearAll}>
            Limpar medições
          </button>
        </div>
      </div>
    </div>
  );
}