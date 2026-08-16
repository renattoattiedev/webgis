// GEO Portal — ScaleBar (portado de escala.component.ts)
// Mostra a escala atual do mapa e permite edição manual (duplo clique).
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { getPointResolution } from 'ol/proj';
import type Map from 'ol/Map';
import { useMapa } from '../../contexts/MapaContext';
import './ScaleBar.css';

const DPI = 96;
const INCHES_PER_METER = 39.37008;
const SCALE_STEP = 1000;

function formatNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export default function ScaleBar() {
  const { mapa, escala, setEscala, setManualZoom } = useMapa();
  const [isEditing, setIsEditing] = useState(false);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const escalaRef = useRef(escala);
  const isEditingRef = useRef(isEditing);
  const manualZoomRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    escalaRef.current = escala;
  }, [escala]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  function applyInitialScale(map: Map, targetScale: number) {
    const view = map.getView();
    const center = view.getCenter();
    const projection = view.getProjection();
    if (!center) return;

    let targetResolution = targetScale / (DPI * INCHES_PER_METER);
    try {
      if (projection.getUnits() === 'degrees') {
        const currentPointResolution = getPointResolution(projection, 1, center);
        targetResolution = targetResolution / currentPointResolution;
      }
      view.setResolution(targetResolution);
    } catch {
      // mantém a escala mesmo se a conversão de resolução falhar
    }

    setEscala(targetScale);
    manualZoomRef.current = true;
    setManualZoom(true);
    setTimeout(() => {
      manualZoomRef.current = false;
      setManualZoom(false);
    }, 2000);
  }

  useEffect(() => {
    if (!mapa) return;
    const view = mapa.getView();
    let debounceId: ReturnType<typeof setTimeout> | undefined;
    let initTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const updateScale = () => {
      if (manualZoomRef.current) return;
      const resolution = view.getResolution();
      const center = view.getCenter();
      const projection = view.getProjection();
      if (!resolution || !center) return;

      let scale: number;
      try {
        const pointResolution = getPointResolution(projection, resolution, center);
        scale = pointResolution * DPI * INCHES_PER_METER;
      } catch {
        scale = resolution * DPI * INCHES_PER_METER;
      }

      const newScaleValue = Math.round(scale);
      if (Math.abs(newScaleValue - escalaRef.current) > 10) {
        setEscala(newScaleValue);
      }
    };

    const debouncedUpdate = () => {
      if (manualZoomRef.current) return;
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(updateScale, 50);
    };

    view.on('change:resolution', debouncedUpdate);
    view.on('change:center', debouncedUpdate);

    if (!initializedRef.current) {
      initializedRef.current = true;
      initTimeoutId = setTimeout(() => applyInitialScale(mapa, escalaRef.current), 100);
    }

    return () => {
      if (debounceId) clearTimeout(debounceId);
      if (initTimeoutId) clearTimeout(initTimeoutId);
      view.un('change:resolution', debouncedUpdate);
      view.un('change:center', debouncedUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapa]);

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

    view.animate({ resolution: targetResolution, duration: 250 });
    setEscala(targetScale);
  }

  function onDoubleClick() {
    if (isEditing) return;
    setIsEditing(true);
    setEditingValue(String(escala));
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  }

  function confirmEdit() {
    const newScale = parseFloat(editingValue.replace(/[^\d]/g, ''));
    if (Number.isNaN(newScale) || newScale <= 0) {
      cancelEdit();
      return;
    }

    const roundedScale = Math.round(newScale / SCALE_STEP) * SCALE_STEP;
    manualZoomRef.current = true;
    setManualZoom(true);
    applyScale(roundedScale);
    setIsEditing(false);

    setTimeout(() => {
      manualZoomRef.current = false;
      setManualZoom(false);
    }, 3000);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditingValue('');
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') confirmEdit();
    else if (e.key === 'Escape') cancelEdit();
  }

  function onBlur() {
    setTimeout(() => {
      if (isEditingRef.current) confirmEdit();
    }, 150);
  }

  return (
    <div
      className={`scalebar-container${isEditing ? ' scalebar-editing' : ''}`}
      onDoubleClick={onDoubleClick}
    >
      {!isEditing ? (
        <div className="scalebar-display">
          <div className="scalebar-text">1:{formatNumber(escala)}</div>
          <div className="scalebar-hint">Duplo clique para editar</div>
        </div>
      ) : (
        <div className="scalebar-edit">
          <div className="scalebar-edit-label">Escala 1:</div>
          <input
            ref={inputRef}
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value.replace(/[^\d]/g, ''))}
            onKeyDown={onKeyDown}
            onBlur={onBlur}
            className="scalebar-input"
            placeholder="Ex: 50000"
          />
          <div className="scalebar-edit-buttons">
            <button
              type="button"
              onClick={confirmEdit}
              className="scalebar-btn scalebar-btn-confirm"
              title="Confirmar"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="scalebar-btn scalebar-btn-cancel"
              title="Cancelar"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
