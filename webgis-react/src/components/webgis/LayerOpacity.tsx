// GEO Portal — LayerOpacity (portado de layer-opacity.component.ts)
// Slider invertido: arrastar para a direita aumenta a opacidade da camada.
import { useState, type ChangeEvent } from 'react';
import type BaseLayer from 'ol/layer/Base';
import { useMapa } from '../../contexts/MapaContext';
import './LayerOpacity.css';

interface LayerOpacityProps {
  /** Camada(s) controladas. Se omitido, controla a camada base atual do mapa. */
  layer?: BaseLayer | BaseLayer[] | null;
}

function resolveLayers(layer: LayerOpacityProps['layer'], baseLayer: BaseLayer | null): BaseLayer[] {
  if (layer) return Array.isArray(layer) ? layer : [layer];
  return baseLayer ? [baseLayer] : [];
}

export default function LayerOpacity({ layer }: LayerOpacityProps) {
  const { mapa } = useMapa();
  const baseLayer = mapa?.getLayers().item(0) ?? null;
  const targetLayers = resolveLayers(layer, baseLayer);
  const currentLayer = targetLayers[0] ?? null;

  const [trackedLayer, setTrackedLayer] = useState(currentLayer);
  const [sliderValue, setSliderValue] = useState(() => 1 - (currentLayer?.getOpacity() ?? 1));

  // Recalcula o valor exibido quando a camada alvo muda (prop ou base layer do
  // mapa) — ajuste de estado durante o render, sem efeito, conforme docs do React.
  if (currentLayer !== trackedLayer) {
    setTrackedLayer(currentLayer);
    setSliderValue(1 - (currentLayer?.getOpacity() ?? 1));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = parseFloat(e.target.value);
    setSliderValue(raw);
    const opacidade = 1 - raw;
    if (Number.isNaN(opacidade)) return;
    targetLayers.forEach((l) => l.setOpacity(opacidade));
  }

  const percentLabel = `${((1 - sliderValue) * 100).toFixed(0)}%`;

  return (
    <div className="layeropacity-wrapper">
      <input
        type="range"
        className="layeropacity-slider"
        min={0}
        max={1}
        step={0.1}
        value={sliderValue}
        onChange={handleChange}
        aria-label="Opacidade da camada"
      />
      <span className="layeropacity-label">{percentLabel}</span>
    </div>
  );
}
