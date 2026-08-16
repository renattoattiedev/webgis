// GEO Portal — TopBar reutilizável
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import './topbar.css';

type TopBarProps = {
  titulo: string;
  subtitulo: string;
  acoes?: ReactNode;
};

export default function TopBar({ titulo, subtitulo, acoes }: TopBarProps) {
  const navigate = useNavigate();
  return (
    <header className="gpt-topbar">
      <button className="gpt-slot" onClick={() => navigate('/')} aria-label="Voltar">
        ←
      </button>
      <div className="gpt-titulo">
        <strong>{titulo}</strong>
        <span>{subtitulo}</span>
      </div>
      {acoes && <div className="gpt-acoes">{acoes}</div>}
    </header>
  );
}