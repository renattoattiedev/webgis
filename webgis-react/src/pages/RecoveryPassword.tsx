// GEO Portal — Recuperar senha (React) — placeholder
import { Link } from 'react-router-dom';
import './login.css';

export default function RecoveryPassword() {
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">GEO PORTAL</div>
          <span className="login-tag">IDE</span>
        </div>
        <h1 className="login-title">Recuperar senha</h1>
        <p className="login-sub">Informe seu e-mail para receber as instruções de redefinição.</p>
        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          <label className="login-field">
            <span>E-mail</span>
            <input type="email" placeholder="voce@exemplo.gov.br" />
          </label>
          <button type="submit" className="login-btn">Enviar instruções</button>
        </form>
        <div className="login-register"><Link to="/login">Voltar para o login</Link></div>
      </div>
    </div>
  );
}