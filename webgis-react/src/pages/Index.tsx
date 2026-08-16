// GEO Portal — Homepage (React)
// Portado do Angular (index.component). Nome genérico, paleta nova.

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './index.css';

const MODULES = [
  { key: 'dados', nome: 'Dados Espaciais', desc: 'Consulta e download de camadas geoespaciais publicadas.', icone: 'layers', ativo: true },
  { key: 'webgis', nome: 'Mapa Interativo', desc: 'Explore camadas sobre o mapa da sua região.', icone: 'map', ativo: true },
  { key: 'pitometria', nome: 'Pitometria', desc: 'Análises de medição de vazão e redes.', icone: 'gauge', ativo: false },
  { key: 'croqui', nome: 'Croqui de Vistoria', desc: 'Gerencie e imprima croquis de vistoria.', icone: 'ruler', ativo: false },
  { key: 'relatorios', nome: 'Relatórios', desc: 'Geração de relatórios técnicos e geoespaciais.', icone: 'file', ativo: false },
];

const STATS = [
  { num: '120+', label: 'Camadas de dados espaciais publicadas' },
  { num: '1M', label: 'Consultas geoespaciais por ano' },
  { num: '98%', label: 'Disponibilidade da plataforma' },
  { num: '30+', label: 'Órgãos atendidos' },
  { num: '24/7', label: 'Monitoramento contínuo' },
  { num: '100%', label: 'Dados abertos' },
  { num: 'SLA', label: 'Níveis de serviço contratados' },
];

const TEMAS = [
  { titulo: 'Lógica', tag: 'Análise espacial' },
  { titulo: 'Hidrologia', tag: 'Recursos hídricos' },
  { titulo: 'Mobilidade', tag: 'Transporte urbano' },
  { titulo: 'Território', tag: 'Planejamento urbano' },
];

export default function Index() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [logado] = useState(false);
  const navigate = useNavigate();
  const go = (p: string) => navigate(p);

  return (
    <div className="idx">
      {/* Navbar */}
      <nav className="idx-nav">
        <div className="idx-nav-left">
          <div className="idx-nav-logo">GEO PORTAL</div>
          <div className="idx-nav-divider" />
          <span className="idx-nav-title">Repositório de Dados Espaciais</span>
          <span className="idx-nav-tag">IDE</span>
        </div>

        <div className="idx-nav-right">
          {logado ? (
            <div className="nav-user" onClick={(e) => { e.stopPropagation(); setMenuAberto(!menuAberto); }}>
              <div className="nav-avatar">U</div>
              <span className="nav-user-name">Usuário</span>
              <svg className={`nav-chevron ${menuAberto ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              {menuAberto && (
                <div className="nav-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="nav-dropdown-header">Usuário</div>
                  <button className="nav-dropdown-item" onClick={() => go('/login')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Meu Perfil
                  </button>
                  <button className="nav-dropdown-item" onClick={() => go('/manager')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Painel Administrativo
                  </button>
                  <div className="nav-dropdown-divider" />
                  <button className="nav-dropdown-item nav-dropdown-item--danger" onClick={() => go('/')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="nav-login-btn" onClick={() => go('/login')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Entrar
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="idx-hero">
        <div className="idx-hero-content">
          <div className="idx-hero-eyebrow"><span className="idx-hero-pulse" /> Plataforma de dados geoespaciais</div>
          <h1 className="idx-hero-title">
            Dados que orientam <em className="idx-hero-title-em">decisões</em> no território.
          </h1>
          <p className="idx-hero-sub">
            Acesse, consulte e analise camadas de dados espaciais do seu município com uma infraestrutura moderna, segura e aberta à sociedade.
          </p>
          <div className="idx-hero-actions">
            <button className="idx-hero-cta" onClick={() => go('/webgis')}>
              Explorar o mapa
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button className="idx-hero-cta-ghost" onClick={() => go('/dados')}>Ver dados espaciais</button>
          </div>
        </div>

        <div className="idx-hero-stats">
          {STATS.map((s, i) => (
            <div key={i} className={`idx-hero-stat ${i === STATS.length - 1 ? 'is-last' : ''}`}>
              <div className="idx-hero-stat-num">{s.num}</div>
              <div className="idx-hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Módulos */}
      <section className="idx-modules" id="modulos">
        <div className="idx-modules-grid">
          {MODULES.map((m) => (
            <div key={m.key} className={`idx-module ${m.ativo ? 'idx-module--active' : 'idx-module--soon'}`} onClick={() => m.ativo && go(`/${m.key}`)}>
              <span className="idx-module-badge">{m.ativo ? 'Acessar' : 'Breve'}</span>
              <div className="idx-module-icon">▲</div>
              <div className="idx-module-name">{m.nome}</div>
              <div className="idx-module-desc">{m.desc}</div>
              <span className="idx-module-link">
                {m.ativo ? 'Acessar módulo' : 'Em desenvolvimento'}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Temas */}
      <section className="idx-temas" id="temas">
        <div className="idx-section-header">
          <div className="idx-section-header-text">
            <div className="idx-section-label">Explorar por tema</div>
            <h2 className="idx-section-title">Coleções temáticas</h2>
          </div>
        </div>
        <div className="idx-temas-grid">
          {TEMAS.map((t) => (
            <div key={t.titulo} className="idx-tema">
              <div className="idx-tema-icone">◈</div>
              <div className="idx-tema-nome">{t.titulo}</div>
              <div className="idx-tema-tag">{t.tag}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="idx-footer">
        <span>Plataforma de Dados Geoespaciais</span>
        <span>© {new Date().getFullYear()} · Todos os direitos reservados</span>
      </footer>
    </div>
  );
}