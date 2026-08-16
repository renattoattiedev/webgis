// GEO Portal — Basemap (portado de basemap.component.ts)
// Troca a camada base do mapa entre basemaps do sistema (WMS) e externos (XYZ).
import { useEffect, useState } from 'react';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import TileWMS from 'ol/source/TileWMS';
import { api } from '../../lib/api';
import { useMapa } from '../../contexts/MapaContext';
import './Basemap.css';

interface BasemapOption {
  key: string;
  name: string;
  thumbnail: string;
  source: string;
  type: 'wms' | 'xyz';
  wmsParams?: Record<string, string>;
}

interface BasemapApiItem {
  id: string;
  name: string;
  thumbnail: string;
  source: string;
  wmsParams?: Record<string, string> | null;
  order?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
}

const EXTERNAL_BASEMAPS: BasemapOption[] = [
  {
    key: 'xyz:osm',
    name: 'OpenStreetMap',
    type: 'xyz',
    source: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    thumbnail: 'https://tile.openstreetmap.org/8/99/142.png',
  },
  {
    key: 'xyz:esri-imagery',
    name: 'Esri Living Atlas',
    type: 'xyz',
    source:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png',
    thumbnail:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/8/142/99.png',
  },
  {
    key: 'xyz:esri-topo',
    name: 'World Topography',
    type: 'xyz',
    source:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.png',
    thumbnail:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/8/142/99.png',
  },
  {
    key: 'xyz:esri-physical',
    name: 'World Physical',
    type: 'xyz',
    source:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}.png',
    thumbnail:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer/tile/8/142/99.png',
  },
  {
    key: 'xyz:esri-street',
    name: 'World Street',
    type: 'xyz',
    source:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}.png',
    thumbnail:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer/tile/8/142/99.png',
  },
];

export default function Basemap() {
  const { mapa, setBasemapUrl } = useMapa();
  const [expanded, setExpanded] = useState(false);
  const [geoserverBasemaps, setGeoserverBasemaps] = useState<BasemapOption[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>(EXTERNAL_BASEMAPS[0].key);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/fetch-basemaps')
      .then((data) => {
        if (cancelled) return;
        const items = (data as { basemaps?: BasemapApiItem[] }).basemaps ?? [];
        const parsed = items
          .filter((b) => b.isActive !== false)
          .sort(
            (a, b) =>
              (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
              a.name.localeCompare(b.name),
          )
          .map((b): BasemapOption => ({
            key: `wms:${b.id}`,
            name: b.name,
            thumbnail: b.thumbnail,
            source: b.source,
            type: 'wms',
            wmsParams: b.wmsParams ?? {},
          }));
        setGeoserverBasemaps(parsed);
      })
      .catch(() => setGeoserverBasemaps([]));

    return () => {
      cancelled = true;
    };
  }, []);

  const allBasemaps = [...geoserverBasemaps, ...EXTERNAL_BASEMAPS];
  const selected = allBasemaps.find((b) => b.key === selectedKey) ?? EXTERNAL_BASEMAPS[0];

  function changeBasemap(basemap: BasemapOption) {
    if (mapa && basemap.key !== selectedKey) {
      const source =
        basemap.type === 'wms'
          ? new TileWMS({
              url: basemap.source,
              params: basemap.wmsParams ?? {},
              crossOrigin: 'anonymous',
            })
          : new XYZ({ url: basemap.source, maxZoom: 19 });

      const newLayer = new TileLayer({ source, preload: 1 });
      mapa.getLayers().setAt(0, newLayer);
      setBasemapUrl(basemap.source);
    }

    setSelectedKey(basemap.key);
    setExpanded(false);
  }

  return (
    <div className="basemap-wrapper">
      <div
        className={`basemap-thumb${expanded ? ' basemap-thumb-active' : ''}`}
        onClick={() => setExpanded((v) => !v)}
        title="Trocar basemap"
      >
        <img src={selected.thumbnail} alt="Basemap atual" className="basemap-thumb-img" />
      </div>

      {expanded && (
        <div className="basemap-panel">
          {geoserverBasemaps.length > 0 && (
            <div className="basemap-section">
              <div className="basemap-section-title">basemaps do sistema</div>
              <div className="basemap-grid basemap-grid-geoserver">
                {geoserverBasemaps.map((b) => (
                  <button
                    type="button"
                    key={b.key}
                    className={`basemap-card${b.key === selectedKey ? ' basemap-card-selected' : ''}`}
                    onClick={() => changeBasemap(b)}
                  >
                    <img src={b.thumbnail} alt={b.name} className="basemap-image" title={`Basemap: ${b.name}`} />
                    <div className="basemap-label">{b.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {geoserverBasemaps.length > 0 && <div className="basemap-divider" />}

          <div className="basemap-section">
            <div className="basemap-section-title">basemaps externos</div>
            <div className="basemap-grid basemap-grid-external">
              {EXTERNAL_BASEMAPS.map((b) => (
                <button
                  type="button"
                  key={b.key}
                  className={`basemap-card${b.key === selectedKey ? ' basemap-card-selected' : ''}`}
                  onClick={() => changeBasemap(b)}
                >
                  <img src={b.thumbnail} alt={b.name} className="basemap-image" title={`Basemap: ${b.name}`} />
                  <div className="basemap-label">{b.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
