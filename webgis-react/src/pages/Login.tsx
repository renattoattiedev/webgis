// GEO Portal — Login (React) — conectado ao backend
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { autenticar } from '../lib/api';
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
    try {
      const resp = await autenticar({ DSC_EMAIL: email, DSC_PASSWORD: senha });
      // Salva dados do usuário e redireciona
      localStorage.setItem('id_usuario', resp.idUsuario);
      navigate('/webgis');
    } catch (err) {
      setErro(
        err instanceof Error && err.message.includes('Captcha')
          ? 'Verificação de segurança não concluída. Tente novamente.'
          : 'E-mail ou senha inválidos.'
      );
    } finally {
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
              required
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
              required
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