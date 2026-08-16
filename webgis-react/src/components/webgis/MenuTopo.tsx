// GEO Portal — MenuTopo (portado de menu-topo.component.ts)
// Barra de ferramentas do topo. Os diálogos completos (pesquisa espacial,
// impressão de croqui, pitometria etc.) não foram portados — cada botão
// aqui abre um painel mínimo, exceto "Coordenadas", que já é funcional e
// mostra o centro atual do mapa via useMapa().
import { useEffect, useState, type ReactNode } from 'react';
import { toLonLat } from 'ol/proj';
import { useMapa } from '../../contexts/MapaContext';
import './MenuTopo.css';

type ToolKey = 'pesquisa-espacial' | 'pesquisar-camadas' | 'coordenadas' | 'imprimir-croqui' | 'tematico';

const TOOL_LABELS: Record<ToolKey, string> = {
  'pesquisa-espacial': 'Pesquisa Espacial',
  'pesquisar-camadas': 'Pesquisar por Camadas',
  coordenadas: 'Pesquisa por Coordenadas',
  'imprimir-croqui': 'Impressão de Croquis',
  tematico: 'Visualização Temática — Pressão',
};

export default function MenuTopo() {
  const { mapa } = useMapa();
  const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
  const [coords, setCoords] = useState('');

  useEffect(() => {
    if (!mapa || activeTool !== 'coordenadas') return;

    const update = () => {
      const center = mapa.getView().getCenter();
      if (!center) return;
      const [lon, lat] = toLonLat(center);
      setCoords(`Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`);
    };

    update();
    mapa.on('moveend', update);
    return () => {
      mapa.un('moveend', update);
    };
  }, [mapa, activeTool]);

  function toggleTool(tool: ToolKey) {
    setActiveTool((current) => (current === tool ? null : tool));
  }

  return (
    <div className="menutopo-wrapper">
      <div className="menutopo-ribbon" role="toolbar" aria-label="Barra de ferramentas">
        <div className="menutopo-group">
          <div className="menutopo-group-tools">
            <ToolButton
              active={activeTool === 'pesquisa-espacial'}
              title="Pesquisa Espacial"
              onClick={() => toggleTool('pesquisa-espacial')}
            >
              <IconSearch />
            </ToolButton>
            <ToolButton
              active={activeTool === 'pesquisar-camadas'}
              title="Pesquisar por camadas"
              onClick={() => toggleTool('pesquisar-camadas')}
            >
              <IconLayers />
            </ToolButton>
            <ToolButton
              active={activeTool === 'coordenadas'}
              title="Pesquisa por Coordenadas"
              onClick={() => toggleTool('coordenadas')}
            >
              <IconTarget />
            </ToolButton>
          </div>
        </div>

        <div className="menutopo-separator" />

        <div className="menutopo-group">
          <div className="menutopo-group-tools">
            <ToolButton
              active={activeTool === 'imprimir-croqui'}
              title="Impressão de Croquis"
              onClick={() => toggleTool('imprimir-croqui')}
            >
              <IconPrint />
            </ToolButton>
          </div>
        </div>

        <div className="menutopo-separator" />

        <div className="menutopo-group">
          <div className="menutopo-group-tools">
            <ToolButton
              active={activeTool === 'tematico'}
              title="Visualização temática — pressão"
              onClick={() => toggleTool('tematico')}
            >
              <IconGradient />
            </ToolButton>
          </div>
        </div>
      </div>

      {activeTool && (
        <div className="menutopo-panel">
          <span>{activeTool === 'coordenadas' && coords ? coords : TOOL_LABELS[activeTool]}</span>
          <button
            type="button"
            className="menutopo-panel-close"
            onClick={() => setActiveTool(null)}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean;
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`menutopo-btn${active ? ' menutopo-btn-active' : ''}`}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

function IconPrint() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9V2h12v7" />
      <rect x="4" y="9" width="16" height="8" rx="1.5" />
      <path d="M6 17h12v5H6z" />
    </svg>
  );
}

function IconGradient() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 15h18M3 9h18" opacity="0.5" />
    </svg>
  );
}
