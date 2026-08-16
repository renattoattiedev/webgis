// GEO Portal — Webgis (mapa interativo) — React com OpenLayers
import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import TopBar from '../components/TopBar';
import './webgis.css';

export default function Webgis() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapa, setMapa] = useState<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapa) return;
    const m = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
      ],
      view: new View({
        center: [-48.5 * 20037508.34 / 180, -25 * 20037508.34 / 180],
        zoom: 8,
      }),
    });
    setMapa(m);
    return () => m.setTarget(undefined);
  }, [mapa]);

  return (
    <div className="webgis">
      <TopBar
        titulo="Mapa Interativo"
        subtitulo="Repositório de Dados Espaciais"
        acoes={
          <>
            <button>Camadas</button>
            <button>Ferramentas</button>
          </>
        }
      />
      <div className="webgis-corpo">
        <aside className="webgis-painel">
          <h3>Camadas</h3>
          <ul className="webgis-camadas">
            <li><span className="w-check" /> Camada base (OSM)</li>
            <li><span className="w-check" /> Limites territoriais</li>
            <li><span className="w-check w-init" /> Rede hidrográfica</li>
            <li><span className="w-check" /> Infraestrutura urbana</li>
          </ul>
        </aside>
        <div ref={mapRef} className="webgis-mapa" data-testid="map-container" />
      </div>
    </div>
  );
}