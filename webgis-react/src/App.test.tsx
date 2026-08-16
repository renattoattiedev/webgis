import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('Home (Index)', () => {
  it('renders o título principal', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    // A home renderiza na rota raiz
    expect(screen.getByText(/Dados que orientam/i)).toBeInTheDocument();
  });

  it('exibe o botão Entrar na navbar (não logado)', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
    expect(screen.getAllByText(/Entrar/i).length).toBeGreaterThan(0);
  });
});

describe('Login', () => {
  it('renderiza o formulário de login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/Acessar a plataforma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/voce@exemplo/i)).toBeInTheDocument();
  });
});