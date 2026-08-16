// GEO Portal — Painel Administrativo (React)
import { useNavigate } from 'react-router-dom';
import './manager.css';

const SECOES = ['Visão geral', 'Conteúdo', 'Grupos', 'Membros', 'Mapas'];

export default function Manager() {
  const navigate = useNavigate();
  return (
    <div className="mgr">
      <header className="mgr-topbar">
        <button className="mgr-slot" onClick={() => navigate('/')}>←</button>
        <div className="mgr-titulo"><strong>Painel Administrativo</strong><span>Gestão da plataforma</span></div>
      </header>
      <div className="mgr-corpo">
        <aside className="mgr-menu">
          {SECOES.map((s, i) => (
            <button key={s} className={`mgr-menu-item ${i === 0 ? 'mgr-active' : ''}`}>{s}</button>
          ))}
        </aside>
        <main className="mgr-content">
          <h1 className="mgr-h1">Visão geral</h1>
          <div className="mgr-cards">
            <div className="mgr-card"><span className="mgr-num">20</span>Sistemas corporativos</div>
            <div className="mgr-card"><span className="mgr-num">120+</span>Camadas publicadas</div>
            <div className="mgr-card"><span className="mgr-num">9</span>Membros da equipe</div>
            <div className="mgr-card"><span className="mgr-num">98%</span>Disponibilidade</div>
          </div>
        </main>
      </div>
    </div>
  );
}