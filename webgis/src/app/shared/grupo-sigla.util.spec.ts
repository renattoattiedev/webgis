import { gerarSiglaSugerida } from './grupo-sigla.util';

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
    expect(gerarSiglaSugerida('Rede de Água', new Set(['RA']))).toBe('R2');
  });

  it('nunca excede 2 caracteres mesmo apos varias colisoes de digito', () => {
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
    expect(resultado.length).toBe(2);
    expect(resultado).toBe('RB');
  });
});
