export type ThematicMethod =
  | 'continuous'
  | 'equalInterval'
  | 'quantile'
  | 'manual';

export type ThematicGeometryKind = 'polygon' | 'line' | 'point';

export interface ThematicDomain {
  min: number;
  max: number;
}

export interface ThematicClassBreak {
  /** Inclusive. Omitted means unbounded below. */
  min?: number;
  /** Inclusive. Omitted means unbounded above. */
  max?: number;
  color: string;
  label?: string;
}

export interface ThematicStyleSpec {
  id: string;
  valueField: string;
  label: string;
  unit?: string;
  method: ThematicMethod;
  domain?: ThematicDomain;
  breaks?: number[];
  classBreaks?: ThematicClassBreak[];
  classes?: number;
  colorRamp: string[];
  geometryKind: ThematicGeometryKind;
  nullColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  pointRadius?: number;
  labelFields?: string[];
}

export interface ThematicLegendTick {
  value: number;
  label: string;
}

export interface ThematicLegendClassItem {
  color: string;
  label: string;
}

export interface ThematicLegendModel {
  spec: ThematicStyleSpec;
  title?: string;
  mode: 'continuous' | 'classes';
  min: number;
  max: number;
  gradientCss: string;
  ticks: ThematicLegendTick[];
  classes: ThematicLegendClassItem[];
}

export interface ThematicContentGroupSource {
  type: 'content-group';
  groupId: string;
}

export interface ThematicLayerMatcher {
  /** Tested against tituloCamada and nomeCamada. */
  match: string | RegExp;
  spec: ThematicStyleSpec;
}

export interface ThematicCatalogEntry {
  spec: ThematicStyleSpec;
  source: ThematicContentGroupSource;
  layerSpecs?: ThematicLayerMatcher[];
}
