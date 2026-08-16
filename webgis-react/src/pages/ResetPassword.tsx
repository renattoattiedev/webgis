// GEO Portal — Redefinir senha (React)
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './login.css';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!senha || !confirmacao) {
      setErro('Preencha ambos os campos.');
      return;
    }
    if (senha !== confirmacao) {
      setErro('As senhas não conferem.');
      return;
    }
    // Aqui seria a chamada real de reset usando o token.
    setEnviado(true);
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">GEO PORTAL</div>
          <span className="login-tag">IDE</span>
        </div>
        <h1 className="login-title">Definir nova senha</h1>
        <p className="login-sub">Escolha uma nova senha para sua conta.</p>

        {enviado ? (
          <div className="login-sucesso">
            <p>Senha atualizada com sucesso!</p>
            <Link to="/login" className="login-btn-link">Ir para o login</Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={onSubmit}>
            {erro && <div className="login-erro" role="alert">{erro}</div>}
            <input type="hidden" value={token ?? ''} readOnly />
            <label className="login-field">
              <span>Nova senha</span>
              <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </label>
            <label className="login-field">
              <span>Confirmar senha</span>
              <input type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
            </label>
            <button type="submit" className="login-btn">Salvar nova senha</button>
          </form>
        )}

        <div className="login-register"><Link to="/login">Voltar para o login</Link></div>
      </div>
    </div>
  );
}