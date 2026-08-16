import {
  ThematicClassBreak,
  ThematicDomain,
  ThematicLegendModel,
  ThematicStyleSpec,
} from '../thematic-style.types';

export function getFeatureProperty(
  feature: { get?: (key: string) => unknown; getKeys?: () => string[]; properties?: Record<string, unknown> },
  field: string,
): unknown {
  if (typeof feature.get === 'function') {
    const direct = feature.get(field);
    if (direct != null && direct !== '') return direct;
    const keys = typeof feature.getKeys === 'function' ? feature.getKeys() : [];
    const match = keys.find((key) => key.toLowerCase() === field.toLowerCase());
    if (match) return feature.get(match);
  }
  if (feature.properties) {
    if (feature.properties[field] != null) return feature.properties[field];
    const match = Object.keys(feature.properties).find(
      (key) => key.toLowerCase() === field.toLowerCase(),
    );
    if (match) return feature.properties[match];
  }
  return null;
}

export function parseNumeric(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function collectNumericValues(
  features: Array<{ get?: (key: string) => unknown; properties?: Record<string, unknown> }>,
  field: string,
): number[] {
  const values: number[] = [];
  for (const feature of features) {
    const raw =
      typeof feature.get === 'function' || feature.properties
        ? getFeatureProperty(feature, field)
        : undefined;
    const num = parseNumeric(raw);
    if (num != null) values.push(num);
  }
  return values;
}

export function resolveDomain(
  spec: ThematicStyleSpec,
  sampleValues: number[] = [],
): ThematicDomain {
  if (spec.domain && spec.domain.max > spec.domain.min) {
    return spec.domain;
  }
  if (spec.classBreaks?.length) {
    const mins = spec.classBreaks
      .map((item) => item.min)
      .filter((value): value is number => value != null);
    const maxs = spec.classBreaks
      .map((item) => item.max ?? item.min)
      .filter((value): value is number => value != null);
    if (mins.length && maxs.length) {
      return { min: Math.min(...mins), max: Math.max(...maxs) };
    }
  }
  if (spec.method === 'manual' && spec.breaks && spec.breaks.length > 0) {
    return {
      min: spec.breaks[0],
      max: spec.breaks[spec.breaks.length - 1],
    };
  }
  if (sampleValues.length === 0) {
    return { min: 0, max: 1 };
  }
  const min = Math.min(...sampleValues);
  const max = Math.max(...sampleValues);
  if (min === max) {
    return { min: min - 1, max: max + 1 };
  }
  return { min, max };
}

export function colorForValue(
  value: unknown,
  spec: ThematicStyleSpec,
  domain: ThematicDomain,
  sampleValues: number[] = [],
): string {
  const num = parseNumeric(value);
  if (num == null) {
    return spec.nullColor ?? 'rgba(160,160,160,0.35)';
  }

  switch (spec.method) {
    case 'manual':
      if (spec.classBreaks?.length) {
        return colorFromClassBreaks(num, spec);
      }
      return colorFromBreaks(num, spec);
    case 'equalInterval':
      return colorFromEqualInterval(num, spec, domain);
    case 'quantile':
      return colorFromQuantile(num, spec, sampleValues);
    case 'continuous':
    default:
      return colorFromContinuous(num, spec, domain);
  }
}

export function legendGradientCss(spec: ThematicStyleSpec): string {
  const stops = spec.colorRamp.length ? spec.colorRamp : ['#cccccc', '#333333'];
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export function buildLegendModel(
  spec: ThematicStyleSpec,
  domain: ThematicDomain,
  title?: string,
): ThematicLegendModel {
  if (spec.classBreaks?.length) {
    return {
      spec,
      title,
      mode: 'classes',
      min: domain.min,
      max: domain.max,
      gradientCss: `linear-gradient(to right, ${spec.classBreaks
        .map((item) => item.color)
        .join(', ')})`,
      ticks: [],
      classes: spec.classBreaks.map((item) => ({
        color: item.color,
        label: item.label ?? formatClassRange(item),
      })),
    };
  }

  const ticks = [domain.min, (domain.min + domain.max) / 2, domain.max].map(
    (value) => ({
      value,
      label: formatThematicValue(value, spec),
    }),
  );
  return {
    spec,
    title,
    mode: 'continuous',
    min: domain.min,
    max: domain.max,
    gradientCss: legendGradientCss(spec),
    ticks,
    classes: [],
  };
}

export function formatThematicValue(
  value: number | null,
  spec: ThematicStyleSpec,
): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return spec.unit ? `${formatted} ${spec.unit}` : formatted;
}

export function applyOpacity(color: string, opacity: number): string {
  const rgb = parseColor(color);
  if (!rgb) return color;
  const a = Math.min(1, Math.max(0, opacity));
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}

function colorFromClassBreaks(
  value: number,
  spec: ThematicStyleSpec,
): string {
  const breaks = spec.classBreaks ?? [];
  if (!breaks.length) return spec.nullColor ?? '#cccccc';

  for (const item of breaks) {
    const minOk = item.min == null || value >= item.min;
    const maxOk = item.max == null || value <= item.max;
    if (minOk && maxOk) return item.color;
  }

  let nearest = breaks[0];
  let nearestDist = Number.POSITIVE_INFINITY;
  for (const item of breaks) {
    const lo = item.min ?? Number.NEGATIVE_INFINITY;
    const hi = item.max ?? Number.POSITIVE_INFINITY;
    const dist = value < lo ? lo - value : value > hi ? value - hi : 0;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = item;
    }
  }
  return nearest.color;
}

function formatClassRange(item: ThematicClassBreak): string {
  if (item.min != null && item.max != null && item.min === item.max) {
    return String(item.min);
  }
  if (item.min != null && item.max == null) {
    return `≥ ${item.min}`;
  }
  if (item.min == null && item.max != null) {
    return `≤ ${item.max}`;
  }
  if (item.min != null && item.max != null) {
    return `${item.min} – ${item.max}`;
  }
  return '—';
}

function colorFromContinuous(
  value: number,
  spec: ThematicStyleSpec,
  domain: ThematicDomain,
): string {
  const span = domain.max - domain.min;
  const t = span === 0 ? 0.5 : (value - domain.min) / span;
  return colorAtRamp(clamp01(t), spec.colorRamp);
}

function colorFromEqualInterval(
  value: number,
  spec: ThematicStyleSpec,
  domain: ThematicDomain,
): string {
  const classes = Math.max(2, spec.classes ?? spec.colorRamp.length ?? 5);
  const span = domain.max - domain.min;
  if (span <= 0) return colorAtRamp(0.5, spec.colorRamp);
  const ratio = clamp01((value - domain.min) / span);
  const index = Math.min(classes - 1, Math.floor(ratio * classes));
  return colorAtRamp(classes === 1 ? 0.5 : index / (classes - 1), spec.colorRamp);
}

function colorFromQuantile(
  value: number,
  spec: ThematicStyleSpec,
  sampleValues: number[],
): string {
  if (!sampleValues.length) {
    return colorAtRamp(0.5, spec.colorRamp);
  }
  const classes = Math.max(2, spec.classes ?? spec.colorRamp.length ?? 5);
  const sorted = [...sampleValues].sort((a, b) => a - b);
  const breaks: number[] = [];
  for (let i = 1; i < classes; i++) {
    const pos = (i / classes) * (sorted.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    const f = pos - lo;
    breaks.push(sorted[lo] + (sorted[hi] - sorted[lo]) * f);
  }
  return colorFromBreaks(value, { ...spec, breaks });
}

function colorFromBreaks(value: number, spec: ThematicStyleSpec): string {
  const breaks = spec.breaks ?? [];
  if (!breaks.length) {
    return colorAtRamp(0.5, spec.colorRamp);
  }
  let index = breaks.length;
  for (let i = 0; i < breaks.length; i++) {
    if (value <= breaks[i]) {
      index = i;
      break;
    }
  }
  const classes = breaks.length + 1;
  return colorAtRamp(classes === 1 ? 0.5 : index / (classes - 1), spec.colorRamp);
}

function colorAtRamp(t: number, ramp: string[]): string {
  const stops = ramp.length ? ramp : ['#cccccc', '#333333'];
  if (stops.length === 1) return stops[0];
  const idx = clamp01(t) * (stops.length - 1);
  const i = Math.min(Math.floor(idx), stops.length - 2);
  const f = idx - i;
  const a = parseColor(stops[i]);
  const b = parseColor(stops[i + 1]);
  if (!a || !b) return stops[i];
  return interpolateRgb(a, b, f);
}

function parseColor(input: string): [number, number, number] | null {
  const value = input.trim();
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
      ];
    }
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
      ];
    }
  }
  const rgb = value.match(
    /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i,
  );
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  return null;
}

function interpolateRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
