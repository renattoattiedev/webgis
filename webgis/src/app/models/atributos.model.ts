export interface Atributos {
  id: string;
  nomeAtributo: string;
  label: string;
  tipo: string;
  tamanho: string;
  visivel: boolean;
  descricao: string;
  ordemRenderizacao: number;
  usuarioCriacao: string;
  usuarioUltimaAlteracao: string;
  createdAt: string;
  updatedAt: string;
}

export interface RespostaApi {
  atributos: Atributos[];
}
