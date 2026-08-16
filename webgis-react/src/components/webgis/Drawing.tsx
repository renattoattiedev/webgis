// GEO Portal — Drawing (portado de drawing.component.ts do Angular)
// Desenho de Point/LineString/Polygon/Circle/Arrow com estilos customizáveis.
import { useEffect, useRef, useState } from 'react';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Draw, Modify, Snap } from 'ol/interaction';
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
} from 'ol/style';
import { LineString, type SimpleGeometry } from 'ol/geom';
import type { GeometryFunction, SketchCoordType } from 'ol/interaction/Draw';
import { useMapa } from '../../contexts/MapaContext';
import './Drawing.css';

type DrawType = 'Selecione' | 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Arrow';

const TYPES: DrawType[] = [
  'Selecione',
  'Point',
  'LineString',
  'Polygon',
  'Circle',
  'Arrow',
];

function hexToRgba(hex: string, opacity: number): string {
  let r = 0;
  let g = 0;
  let b = 0;
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

const ARROW_LENGTH = 10000;

export default function Drawing() {
  const { mapa } = useMapa();
  const sourceRef = useRef(new VectorSource({ wrapX: false }));
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const drawRef = useRef<Draw | null>(null);

  const [drawType, setDrawType] = useState<DrawType>('Selecione');
  const [freehand, setFreehand] = useState(false);
  const [clearPrevious, setClearPrevious] = useState(false);
  const [lineWidth, setLineWidth] = useState(2);
  const [lineColor, setLineColor] = useState('#ffcc33');
  const [fillColor, setFillColor] = useState('#ffffff');
  const [fillOpacity, setFillOpacity] = useState(1.0);

  useEffect(() => {
    if (!mapa) return;
    const source = sourceRef.current;

    const vectorLayer = new VectorLayer({
      source,
      style: getStyle(),
    });
    vectorLayerRef.current = vectorLayer;
    mapa.addLayer(vectorLayer);

    // Modify + Snap
    mapa.addInteraction(new Modify({ source }));
    mapa.addInteraction(new Snap({ source }));

    return () => {
      mapa.removeLayer(vectorLayer);
      if (drawRef.current) {
        mapa.removeInteraction(drawRef.current);
        drawRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa]);

  function getStyle() {
    return new Style({
      fill: new Fill({ color: hexToRgba(fillColor, fillOpacity) }),
      stroke: new Stroke({ color: lineColor, width: lineWidth }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({ color: lineColor }),
      }),
    });
  }

  function arrowGeometryFunction(
    coordinates: SketchCoordType,
    geometry?: SimpleGeometry,
  ): SimpleGeometry {
    const start = coordinates[0] as number[];
    const end = coordinates[coordinates.length - 1] as number[];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);

    const point1 = [
      end[0] - ARROW_LENGTH * Math.cos(rotation - Math.PI / 6),
      end[1] - ARROW_LENGTH * Math.sin(rotation - Math.PI / 6),
    ];
    const point2 = [
      end[0] - ARROW_LENGTH * Math.cos(rotation + Math.PI / 6),
      end[1] - ARROW_LENGTH * Math.sin(rotation + Math.PI / 6),
    ];

    let g: LineString;
    if (geometry && geometry instanceof LineString) {
      g = geometry;
      g.setCoordinates([start, end, point1, end, point2, end]);
    } else {
      g = new LineString([start, end, point1, end, point2, end]);
    }
    return g;
  }

  function updateDrawInteraction() {
    if (!mapa) return;

    if (drawRef.current) {
      mapa.removeInteraction(drawRef.current);
      drawRef.current = null;
    }
    if (drawType === 'Selecione') return;

    let geometryFunction: GeometryFunction | undefined;
    let type: 'Point' | 'LineString' | 'Polygon' | 'Circle';

    if (drawType === 'Arrow') {
      type = 'LineString';
      geometryFunction = arrowGeometryFunction;
    } else {
      type = drawType;
    }

    const draw = new Draw({
      source: sourceRef.current,
      type,
      freehand,
      geometryFunction,
    });

    draw.on('drawstart', () => {
      if (clearPrevious) sourceRef.current.clear();
    });

    drawRef.current = draw;
    mapa.addInteraction(draw);
  }

  useEffect(() => {
    if (drawRef.current && mapa) {
      mapa.removeInteraction(drawRef.current);
    }
    if (drawType !== 'Selecione') updateDrawInteraction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawType, freehand, clearPrevious]);

  // aplica style quando cor/largura/opacity mudam
  useEffect(() => {
    vectorLayerRef.current?.setStyle(getStyle());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineWidth, lineColor, fillColor, fillOpacity]);

  function clearAll() {
    sourceRef.current.clear();
  }

  return (
    <div className="drawing-panel">
      <div className="drawing-header">Desenhar</div>
      <div className="drawing-body">
        <div className="drawing-row">
          <label>Geometria</label>
          <select
            value={drawType}
            onChange={(e) => setDrawType(e.target.value as DrawType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="drawing-row drawing-check">
          <label>
            <input
              type="checkbox"
              checked={freehand}
              onChange={(e) => setFreehand(e.target.checked)}
            />
            Mão livre (freehand)
          </label>
        </div>
        <div className="drawing-row drawing-check">
          <label>
            <input
              type="checkbox"
              checked={clearPrevious}
              onChange={(e) => {
                setClearPrevious(e.target.checked);
                if (e.target.checked) sourceRef.current.clear();
              }}
            />
            Limpar desenhos anteriores
          </label>
        </div>

        <div className="drawing-row">
          <label>Largura: {lineWidth}</label>
          <input
            type="range"
            min={1}
            max={10}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </div>
        <div className="drawing-row">
          <label>Cor da linha</label>
          <input
            type="color"
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
          />
        </div>
        <div className="drawing-row">
          <label>Cor do preenchimento</label>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
          />
        </div>
        <div className="drawing-row">
          <label>Opacidade: {Math.round(fillOpacity * 100)}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(fillOpacity * 100)}
            onChange={(e) => setFillOpacity(Number(e.target.value) / 100)}
          />
        </div>

        <div className="drawing-actions">
          <button type="button" className="drawing-clear" onClick={clearAll}>
            Limpar tudo
          </button>
        </div>
      </div>
    </div>
  );
}