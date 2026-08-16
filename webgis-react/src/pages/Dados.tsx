// GEO Portal — Dados Espaciais (React)
import { useNavigate } from 'react-router-dom';
import './dados.css';

const CAMADAS = [
  { nome: 'Limites territoriais', tipo: 'Vetorial', atualizacao: 'Anual', formato: 'GeoJSON' },
  { nome: 'Rede hidrográfica', tipo: 'Vetorial', atualizacao: 'Semestral', formato: 'GeoPackage' },
  { nome: 'Infraestrutura urbana', tipo: 'Vetorial', atualizacao: 'Trimestral', formato: 'Shapefile' },
  { nome: 'Imagens - Ortofotos', tipo: 'Raster', atualizacao: 'Bianual', formato: 'GeoTIFF' },
  { nome: 'Sistema viário', tipo: 'Vetorial', atualizacao: 'Anual', formato: 'GeoJSON' },
  { nome: 'Uso do solo', tipo: 'Vetorial', atualizacao: 'Anual', formato: 'GeoPackage' },
];

export default function Dados() {
  const navigate = useNavigate();
  return (
    <div className="dados">
      <header className="dados-topbar">
        <button className="dados-slot" onClick={() => navigate('/')}>←</button>
        <div className="dados-titulo">
          <strong>Dados Espaciais</strong>
          <span>Catálogo de camadas disponíveis</span>
        </div>
      </header>
      <div className="dados-wrap">
        <h1 className="dados-h1">Catálogo de dados</h1>
        <div className="dados-grid">
          {CAMADAS.map((c) => (
            <div key={c.nome} className="dados-card">
              <div className="dados-card-top">
                <span className="dados-tipo">{c.tipo}</span>
                <span className="dados-formato">{c.formato}</span>
              </div>
              <h3 className="dados-nome">{c.nome}</h3>
              <div className="dados-meta">
                <span>Atualização: <strong>{c.atualizacao}</strong></span>
              </div>
              <button className="dados-btn">Baixar camada</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}