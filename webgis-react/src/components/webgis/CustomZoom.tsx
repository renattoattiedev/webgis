// GEO Portal — CustomZoom (portado de customzoom.component.ts)
// Botões +/- e régua de escala vertical para zoom manual do mapa.
import { useState, type MouseEvent } from 'react';
import { getPointResolution } from 'ol/proj';
import { useMapa } from '../../contexts/MapaContext';
import './CustomZoom.css';

const DPI = 96;
const INCHES_PER_METER = 39.37008;
const SCALE_STEP = 1000;
const MIN_SCALE = 1000;
const MAX_SCALE = 2000000;
const RULER_MARKS = Array.from({ length: 19 }, (_, i) => 95 - i * 5);

export default function CustomZoom() {
  const { mapa, escala, setEscala, setManualZoom } = useMapa();
  const [isZooming, setIsZooming] = useState(false);

  function applyScale(targetScale: number) {
    if (!mapa) return;
    const view = mapa.getView();
    const center = view.getCenter();
    const projection = view.getProjection();
    if (!center) return;

    let targetResolution = targetScale / (DPI * INCHES_PER_METER);
    try {
      if (projection.getUnits() === 'degrees') {
        const currentPointResolution = getPointResolution(projection, 1, center);
        targetResolution = targetResolution / currentPointResolution;
      }
    } catch {
      // usa resolução linear como alternativa
    }

    view.animate({
      resolution: targetResolution,
      duration: 250,
      easing: (t) => t * (2 - t),
    });
  }

  function jumpToScale(targetScale: number) {
    if (isZooming || !mapa || targetScale === escala) return;

    setIsZooming(true);
    setManualZoom(true);
    setEscala(targetScale);
    applyScale(targetScale);

    setTimeout(() => {
      setIsZooming(false);
      setManualZoom(false);
    }, 300);
  }

  function zoomIn() {
    jumpToScale(Math.max(escala - SCALE_STEP, SCALE_STEP));
  }

  function zoomOut() {
    jumpToScale(escala + SCALE_STEP);
  }

  function onRulerClick(e: MouseEvent<HTMLDivElement>) {
    if (isZooming) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const percentage = (clickY / rect.height) * 100;
    const targetScale = MIN_SCALE + (percentage / 100) * (MAX_SCALE - MIN_SCALE);
    const roundedScale = Math.round(targetScale / 1000) * 1000;
    jumpToScale(Math.max(roundedScale, MIN_SCALE));
  }

  const position = Math.max(0, Math.min(100, ((escala - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100));

  return (
    <div className="customzoom-controls">
      <button
        type="button"
        className="customzoom-btn customzoom-in"
        onClick={zoomIn}
        disabled={isZooming}
        title="Zoom In (-1000)"
        aria-label="Zoom In"
      >
        +
      </button>

      <div className="customzoom-ruler">
        <div className="customzoom-ruler-bar" onClick={onRulerClick}>
          <div className="customzoom-ruler-marks">
            {RULER_MARKS.map((top) => (
              <div key={top} className="customzoom-ruler-line" style={{ top: `${top}%` }} />
            ))}
          </div>
          <div className="customzoom-position" style={{ top: `${position}%` }}>
            {(escala / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      <button
        type="button"
        className="customzoom-btn customzoom-out"
        onClick={zoomOut}
        disabled={isZooming}
        title="Zoom Out (+1000)"
        aria-label="Zoom Out"
      >
        −
      </button>
    </div>
  );
}
