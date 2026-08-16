import type { FeatureLike } from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import type { StyleFunction } from 'ol/style/Style';
import {
  applyOpacity,
  colorForValue,
  getFeatureProperty,
} from '../classifier/thematic-classifier';
import { ThematicDomain, ThematicStyleSpec } from '../thematic-style.types';

export const THEMATIC_LAYER_KEY = 'thematicLayer';
export const THEMATIC_SPEC_ID_KEY = 'thematicSpecId';
export const THEMATIC_SPEC_KEY = 'thematicSpec';
export const THEMATIC_TITLE_KEY = 'thematicTitle';
export const THEMATIC_NOME_CAMADA_KEY = 'thematicNomeCamada';

export function createThematicStyleFunction(
  spec: ThematicStyleSpec,
  domain: ThematicDomain,
  sampleValues: number[] = [],
): StyleFunction {
  const fillOpacity = spec.fillOpacity ?? 0.72;
  const strokeWidth = spec.strokeWidth ?? 1;
  const strokeColor = spec.strokeColor ?? 'rgba(255,255,255,0.65)';
  const pointRadius = spec.pointRadius ?? 6;

  return (feature: FeatureLike) => {
    const fillColor = applyOpacity(
      colorForValue(getFeatureProperty(feature, spec.valueField), spec, domain, sampleValues),
      fillOpacity,
    );

    if (spec.geometryKind === 'point') {
      return new Style({
        image: new CircleStyle({
          radius: pointRadius,
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
        }),
      });
    }

    if (spec.geometryKind === 'line') {
      return new Style({
        stroke: new Stroke({ color: fillColor, width: Math.max(2, strokeWidth + 1) }),
      });
    }

    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
    });
  };
}

export function createHighlightStyle(): Style {
  return new Style({
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
    fill: new Fill({ color: 'rgba(255,255,255,0.08)' }),
  });
}
