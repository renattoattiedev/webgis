// GEO Portal — E-mail verificado (React)
import { Link } from 'react-router-dom';
import './login.css';

export default function EmailVerificado() {
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">GEO PORTAL</div>
          <span className="login-tag">IDE</span>
        </div>
        <h1 className="login-title">E-mail verificado ✓</h1>
        <p className="login-sub">Sua conta foi confirmada com sucesso. Agora você já pode acessar a plataforma.</p>
        <Link to="/login" className="login-btn login-btn-link">Ir para o login</Link>
      </div>
    </div>
  );
}