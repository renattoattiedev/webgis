export interface AcessoPorDia {
  data: string; // 'YYYY-MM-DD'
  total: number;
}

export interface TopCamada {
  cod: string;
  nome: string;
  grupo: string;
  acessos: number;
}

export interface TabelaUsoCamada {
  cod: string;
  nome: string;
  grupo: string;
  tema: string;
  acessos: number;
  favoritos: number;
}

export interface RelatorioUsoData {
  kpis: {
    totalAcessos: number;
    totalAcessosAnterior: number;
    camadasAcessadas: number;
    totalCamadasAtivas: number;
    camadasAcessadasAnterior: number;
    mapasVisualizados: number;
    totalMapas: number;
    mapasVisualizadosAnterior: number;
    totalFavoritos: number;
  };
  acessosPorDia: AcessoPorDia[];
  topCamadas: TopCamada[];
  tabela: TabelaUsoCamada[];
}

export interface InventarioCamada {
  nome: string;
  titulo: string;
  grupo: string;
  tema: string;
  compartilhamento: string;
  totalAtributos: number;
  ativa: boolean;
  criadaEm: Date;
}

export interface PorTema {
  tema: string;
  total: number;
}

export interface PorNivel {
  nivel: string;
  total: number;
}

export interface RelatorioInventarioData {
  kpis: {
    ativas: number;
    inativas: number;
    raster: number;
    semAtributos: number;
  };
  porTema: PorTema[];
  porNivel: PorNivel[];
  tabela: InventarioCamada[];
}

export interface UsuarioTabela {
  nome: string;
  email: string;
  perfil: string;
  ultimoAcesso: Date | null;
  logins: number;
  ativo: boolean;
  camadas: number;
  mapas: number;
  raster: number;
  favoritos: number;
  ultimaAtividade: Date | null;
}

export interface AtividadeItem {
  tipo: 'camada' | 'mapa';
  nome: string;
  acao: 'criou' | 'editou';
  usuario: string;
  data: Date;
}

export interface RelatorioUsuariosData {
  kpis: {
    total: number;
    admins: number;
    editores: number;
    inativos: number;
  };
  porPerfil: { perfil: string; total: number }[];
  tabela: UsuarioTabela[];
  atividadeRecente: AtividadeItem[];
}

export abstract class RelatoriosRepository {
  abstract fetchUso(params: {
    dataInicio: Date;
    dataFim: Date;
  }): Promise<RelatorioUsoData>;

  abstract fetchInventario(params: {
    temaId?: string;
    ativo?: boolean;
  }): Promise<RelatorioInventarioData>;

  abstract fetchUsuarios(params: {
    perfil?: string;
    diasInativo?: number;
  }): Promise<RelatorioUsuariosData>;
}
