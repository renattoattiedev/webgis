function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

function candidatoBase(nome: string): string {
  const todasPalavras = normalizar(nome)
    .split(/\s+/)
    .filter((p) => p.length > 0);

  // Ignora preposicoes/artigos curtos (ex: "de", "da", "do") ao escolher as
  // duas palavras que formam a sigla, a menos que isso deixe menos de duas
  // palavras disponiveis.
  const palavrasSignificativas = todasPalavras.filter((p) => p.length > 2);
  const palavras =
    palavrasSignificativas.length >= 2 ? palavrasSignificativas : todasPalavras;

  if (palavras.length >= 2) {
    return `${palavras[0][0]}${palavras[1][0]}`;
  }
  if (palavras.length === 1) {
    return palavras[0].slice(0, 2).padEnd(2, 'X');
  }
  return 'XX';
}

export function gerarSiglaSugerida(
  nome: string,
  siglasExistentes: Set<string>,
): string {
  const base = candidatoBase(nome);

  if (!siglasExistentes.has(base)) {
    return base;
  }

  const primeiraLetra = base[0];

  // Sigla e sempre 2 caracteres (coluna SGL_GRUPO_ID e VARCHAR(2)). Tenta
  // primeiro <primeiraLetra><digito> para digito 2-9 (8 variantes) e, se
  // todos colidirem, cai para <primeiraLetra><letra> de A a Z, pulando o
  // candidato base e o que ja estiver em siglasExistentes.
  for (let digito = 2; digito <= 9; digito += 1) {
    const candidato = `${primeiraLetra}${digito}`;
    if (!siglasExistentes.has(candidato)) {
      return candidato;
    }
  }

  for (
    let codigo = 'A'.charCodeAt(0);
    codigo <= 'Z'.charCodeAt(0);
    codigo += 1
  ) {
    const letra = String.fromCharCode(codigo);
    const candidato = `${primeiraLetra}${letra}`;
    if (candidato === base) {
      continue;
    }
    if (!siglasExistentes.has(candidato)) {
      return candidato;
    }
  }

  throw new Error(
    `Nao foi possivel gerar uma sigla unica de 2 caracteres para "${primeiraLetra}": todas as combinacoes foram esgotadas.`,
  );
}
