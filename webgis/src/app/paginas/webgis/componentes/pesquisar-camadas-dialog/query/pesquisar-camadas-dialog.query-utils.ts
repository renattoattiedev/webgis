import { Atributos } from 'src/app/models/atributos.model';
import { TipoConsultaConfig, TipoConsultaDisponivel } from '../pesquisar-camadas-dialog.types';

export function normalizarTexto(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

export function atributosPossuiNome(attrs: Atributos[], nome: string): boolean {
  const alvo = normalizarTexto(nome).trim();
  return attrs.some((a) => {
    const n = normalizarTexto(a.nomeAtributo ?? '').trim();
    const l = normalizarTexto(a.label ?? '').trim();
    return n === alvo || l === alvo;
  });
}

export function encontrarAtributoParaTipo(
  tipo: TipoConsultaConfig,
  attrs: Atributos[],
): Atributos | null {
  for (const attr of attrs) {
    const nomeNorm = normalizarTexto(attr.nomeAtributo ?? '');
    const labelNorm = normalizarTexto(attr.label ?? '');
    for (const kw of tipo.keywords) {
      const kwNorm = normalizarTexto(kw);
      if (
        nomeNorm.includes(kwNorm) ||
        nomeNorm === kwNorm ||
        labelNorm.includes(kwNorm) ||
        labelNorm === kwNorm
      ) {
        return attr;
      }
    }
  }
  return null;
}

export function mapearTiposConsultaParaCamada(
  tiposConsulta: TipoConsultaConfig[],
  attrs: Atributos[],
): TipoConsultaDisponivel[] {
  const nomesUsados = new Set<string>();
  return tiposConsulta.map((tipo) => {
    const attr = encontrarAtributoParaTipo(tipo, attrs);
    const nomeAtributo =
      attr && !nomesUsados.has(attr.nomeAtributo)
        ? (nomesUsados.add(attr.nomeAtributo), attr.nomeAtributo)
        : null;
    return { id: tipo.id, label: tipo.label, nomeAtributo };
  });
}

export function encontrarAtributoDvNome(attrs: Atributos[]): string | null {
  const keywords = ['dv', 'digito', 'digito_verificador', 'digito verificador'];
  for (const attr of attrs) {
    const nomeNorm = normalizarTexto(attr.nomeAtributo ?? '');
    const labelNorm = normalizarTexto(attr.label ?? '');
    for (const kw of keywords) {
      const kwNorm = normalizarTexto(kw);
      if (
        nomeNorm === kwNorm ||
        nomeNorm.includes(kwNorm) ||
        labelNorm === kwNorm ||
        labelNorm.includes(kwNorm)
      ) {
        return attr.nomeAtributo ?? null;
      }
    }
  }
  return null;
}

export function resolverColunaDv(attrs: Atributos[]): string {
  const daLista = encontrarAtributoDvNome(attrs);
  if (daLista) return daLista;
  return 'dv';
}

export function resolverColunaMatricula(
  tiposDisponiveis: TipoConsultaDisponivel[],
  tiposConsulta: TipoConsultaConfig[],
  attrs: Atributos[],
  nomeCamada?: string,
): string {
  const itemMatricula = tiposDisponiveis.find((t) => t.id === 'matricula');
  const nomeDoTipo = itemMatricula?.nomeAtributo?.trim();
  if (nomeDoTipo) return nomeDoTipo;

  const tipoMatricula = tiposConsulta.find((t) => t.id === 'matricula');
  if (tipoMatricula) {
    const daLista = encontrarAtributoParaTipo(tipoMatricula, attrs);
    if (daLista?.nomeAtributo) return daLista.nomeAtributo;
  }

  if (nomeCamada === 'vw_ligacao') {
    return 'Matrícula';
  }

  return 'matricula';
}

function escaparValor(val: string): string {
  return (val || '').replace(/'/g, "''");
}

export function construirExpressaoFiltro(params: {
  filtroSelecionado: string;
  valorFiltro: string;
  valorDv: string;
  nomeAtributoAtual?: string | null;
  tiposDisponiveis: TipoConsultaDisponivel[];
  tiposConsulta: TipoConsultaConfig[];
  atributosCamada: Atributos[];
  nomeCamada?: string;
}): string | null {
  const item = params.tiposDisponiveis.find(
    (t) => t.id === params.filtroSelecionado,
  );
  const attr = params.nomeAtributoAtual?.trim()
    ? params.nomeAtributoAtual.trim()
    :
    params.filtroSelecionado === 'matricula'
      ? resolverColunaMatricula(
          params.tiposDisponiveis,
          params.tiposConsulta,
          params.atributosCamada,
          params.nomeCamada,
        )
      : item?.nomeAtributo?.trim();
  const val = params.valorFiltro?.trim() ?? '';
  if (!attr) return null;
  const valorEscapado = escaparValor(val);
  if (!valorEscapado) return null;
  if (params.filtroSelecionado === 'matricula') {
    const dvAtributo = resolverColunaDv(params.atributosCamada);
    const dv = params.valorDv?.trim() ?? '';
    const dvEscapado = escaparValor(dv);
    if (!dvAtributo || !dvEscapado) return null;
    return `"${attr}" = ${valorEscapado} AND "${dvAtributo}" = ${dvEscapado}`;
  }
  return `"${attr}" ILIKE '%${valorEscapado}%'`;
}
