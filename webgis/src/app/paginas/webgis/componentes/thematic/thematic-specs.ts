import { Camadas } from 'src/app/models/camadas.model';
import {
  ThematicCatalogEntry,
  ThematicClassBreak,
  ThematicStyleSpec,
} from './thematic-style.types';

export const PRESSAO_GRUPO_ID = '99eb846c-fd4e-4d97-84dd-ba8e58bbb7fc';

const PRESSAO_LABEL_FIELDS = [
  'nome_setor',
  'nome',
  'setor',
  'ds_setor',
  'descricao',
  'titulo',
  'nm_setor',
];

const PRESSAO_BASE = {
  valueField: 'pressao_media_setor',
  unit: 'mca',
  method: 'manual' as const,
  geometryKind: 'polygon' as const,
  fillOpacity: 0.78,
  strokeColor: 'rgba(80, 40, 10, 0.35)',
  strokeWidth: 1,
  labelFields: PRESSAO_LABEL_FIELDS,
};

function specFromBreaks(
  id: string,
  label: string,
  classBreaks: ThematicClassBreak[],
): ThematicStyleSpec {
  return {
    ...PRESSAO_BASE,
    id,
    label,
    classBreaks,
    colorRamp: classBreaks.map((item) => item.color),
  };
}

/** ColorBrewer YlOrBr aligned to the GeoServer classified legend. */
export const PRESSAO_RESERVATORIO_SPEC = specFromBreaks(
  'pressao-media-reservatorio',
  'Pressão média',
  [
    { min: 0, max: 9, color: '#ffffd4', label: '0 – 9' },
    { min: 10, max: 18, color: '#fee391', label: '10 – 18' },
    { min: 19, max: 27, color: '#fec44f', label: '19 – 27' },
    { min: 28, max: 36, color: '#fe9929', label: '28 – 36' },
    { min: 37, max: 45, color: '#d95f0e', label: '37 – 45' },
    { min: 46, color: '#993404', label: '≥ 46' },
  ],
);

export const PRESSAO_ELEVATORIA_SPEC = specFromBreaks(
  'pressao-media-elevatoria',
  'Pressão média',
  [
    { min: 12, max: 12, color: '#ffffe5', label: '12' },
    { min: 13, max: 29, color: '#fff7bc', label: '13 – 29' },
    { min: 30, max: 37, color: '#fee391', label: '30 – 37' },
    { min: 38, max: 40, color: '#fec44f', label: '38 – 40' },
    { min: 41, max: 47, color: '#fe9929', label: '41 – 47' },
    { min: 48, max: 54, color: '#ec7014', label: '48 – 54' },
    { min: 55, max: 58, color: '#cc4c02', label: '55 – 58' },
    { min: 59, max: 62, color: '#993404', label: '59 – 62' },
    { min: 63, max: 74, color: '#662506', label: '63 – 74' },
    { min: 75, color: '#3f1704', label: '≥ 75' },
  ],
);

export const PRESSAO_VRP_SPEC = specFromBreaks(
  'pressao-media-vrp',
  'Pressão média',
  [
    { min: 0, max: 0, color: '#ffffe5', label: '0' },
    { min: 1, max: 2, color: '#fff7bc', label: '1 – 2' },
    { min: 3, max: 6, color: '#fee391', label: '3 – 6' },
    { min: 7, max: 11, color: '#fec44f', label: '7 – 11' },
    { min: 12, max: 18, color: '#fe9929', label: '12 – 18' },
    { min: 19, max: 21, color: '#cc4c02', label: '19 – 21' },
    { min: 22, max: 39, color: '#993404', label: '22 – 39' },
    { min: 40, max: 58, color: '#662506', label: '40 – 58' },
  ],
);

export const PRESSAO_MEDIA_SPEC = PRESSAO_RESERVATORIO_SPEC;

export function resolveSpecForCamada(
  entry: ThematicCatalogEntry,
  camada: Camadas,
): ThematicStyleSpec {
  const haystack = camadaHaystack(camada);
  for (const item of entry.layerSpecs ?? []) {
    if (matcherHits(item.match, haystack)) return item.spec;
  }
  return entry.spec;
}

export function findThematicSpec(camada: Camadas): ThematicStyleSpec | null {
  const haystack = camadaHaystack(camada);
  for (const entry of THEMATIC_CATALOG) {
    const inGroup = camada.grupoCamada === entry.source.groupId;
    const named = (entry.layerSpecs ?? []).some((item) =>
      matcherHits(item.match, haystack),
    );
    if (inGroup || named) {
      return resolveSpecForCamada(entry, camada);
    }
  }
  return null;
}

function camadaHaystack(camada: Camadas): string {
  return `${camada.tituloCamada ?? ''} ${camada.nomeCamada ?? ''}`;
}

function matcherHits(match: string | RegExp, haystack: string): boolean {
  return typeof match === 'string'
    ? haystack.toLowerCase().includes(match.toLowerCase())
    : match.test(haystack);
}

export const THEMATIC_CATALOG: ThematicCatalogEntry[] = [
  {
    spec: PRESSAO_MEDIA_SPEC,
    source: { type: 'content-group', groupId: PRESSAO_GRUPO_ID },
    layerSpecs: [
      { match: /elevat/i, spec: PRESSAO_ELEVATORIA_SPEC },
      { match: /vrp/i, spec: PRESSAO_VRP_SPEC },
      { match: /reservat/i, spec: PRESSAO_RESERVATORIO_SPEC },
    ],
  },
];
