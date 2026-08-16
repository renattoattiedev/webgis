export interface CarregamentoDefaultItem {
  id: string;
  grupoId: string;
  temaId: string;
  tipo: 'V' | 'R' | 'M';
  carregamentoDefault: boolean;
}

export interface CarregamentoDefaultResponse {
  conteudo: CarregamentoDefaultItem[];
  total: number;
}
