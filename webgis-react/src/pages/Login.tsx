// GEO Portal — Login (React)
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    // Exemplo: chamada ao backend. Adaptar para a API real (via variável de ambiente).
    try {
      // placeholder de autenticação
      if (!email || !senha) {
        setErro('Informe e-mail e senha.');
        setCarregando(false);
        return;
      }
      // Aqui seria a chamada real: await api.auth.login(email, senha)
      navigate('/webgis');
    } catch {
      setErro('Não foi possível entrar. Verifique suas credenciais.');
      setCarregando(false);
    }
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">GEO PORTAL</div>
          <span className="login-tag">IDE</span>
        </div>
        <h1 className="login-title">Acessar a plataforma</h1>
        <p className="login-sub">Entre para explorar dados espaciais.</p>

        {erro && <div className="login-erro" role="alert">{erro}</div>}

        <form onSubmit={onSubmit} className="login-form">
          <label className="login-field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.gov.br"
              autoComplete="email"
            />
          </label>
          <label className="login-field">
            <span>Senha</span>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="login-btn" disabled={carregando}>
            {carregando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="login-actions">
          <Link to="/recovery-password">Esqueci minha senha</Link>
        </div>
        <div className="login-register">
          Não tem conta? <Link to="/register-user">Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}