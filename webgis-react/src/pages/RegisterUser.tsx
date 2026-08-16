// GEO Portal — Cadastro de usuário (React) — placeholder
import { Link } from 'react-router-dom';
import './login.css';

export default function RegisterUser() {
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">GEO PORTAL</div>
          <span className="login-tag">IDE</span>
        </div>
        <h1 className="login-title">Criar conta</h1>
        <p className="login-sub">Cadastre-se para acessar a plataforma.</p>
        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <label className="login-field">
            <span>Nome completo</span>
            <input type="text" placeholder="Seu nome" />
          </label>
          <label className="login-field">
            <span>E-mail</span>
            <input type="email" placeholder="voce@exemplo.gov.br" />
          </label>
          <label className="login-field">
            <span>Senha</span>
            <input type="password" placeholder="••••••••" />
          </label>
          <button type="submit" className="login-btn">Cadastrar</button>
        </form>
        <div className="login-register"><Link to="/login">Já tenho conta · Entrar</Link></div>
      </div>
    </div>
  );
}