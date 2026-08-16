export interface Componente {
  id: string;
  nome: string;
  descricao: string;
  configuracao: any; // Use um tipo mais específico se souber a estrutura
  habilitado: boolean;
}

export interface RespostaApiComponentes {
  componentes: Componente[];
}
