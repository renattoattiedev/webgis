import { describe, it, expect } from 'vitest';
import { gerarSiglaSugerida } from './gerar-sigla-sugerida';

describe('gerarSiglaSugerida', () => {
  it('usa as iniciais das duas primeiras palavras do nome', () => {
    expect(gerarSiglaSugerida('Rede de Água', new Set())).toBe('RA');
  });

  it('usa as duas primeiras letras quando o nome tem uma palavra so', () => {
    expect(gerarSiglaSugerida('Setores', new Set())).toBe('SE');
  });

  it('remove acentos e ignora caixa', () => {
    expect(gerarSiglaSugerida('área de proteção', new Set())).toBe('AP');
  });

  it('resolve colisao tentando <primeira-letra><digito> incrementando', () => {
    const existentes = new Set(['RA']);
    expect(gerarSiglaSugerida('Rede de Água', existentes)).toBe('R2');
  });

  it('incrementa o digito ate achar uma sigla livre', () => {
    const existentes = new Set(['RA', 'R2', 'R3']);
    expect(gerarSiglaSugerida('Rede de Água', existentes)).toBe('R4');
  });

  it('ignora palavras vazias ao dividir o nome (espacos duplicados)', () => {
    expect(gerarSiglaSugerida('  Rede   de Água  ', new Set())).toBe('RA');
  });

  it('retorna "XX" para nome vazio ou apenas espacos (comportamento degenerado intencional)', () => {
    expect(gerarSiglaSugerida('   ', new Set())).toBe('XX');
  });

  it('nunca gera sigla com mais de 2 caracteres apos varias colisoes, caindo para letras', () => {
    const existentes = new Set([
      'RA',
      'R2',
      'R3',
      'R4',
      'R5',
      'R6',
      'R7',
      'R8',
      'R9',
    ]);
    const resultado = gerarSiglaSugerida('Rede de Água', existentes);
    expect(resultado).toHaveLength(2);
    expect(resultado).toBe('RB');
    expect(existentes.has(resultado)).toBe(false);
  });
});
