export interface CamadaPublicavel {
  tableName: string;
  published: boolean;
  camadaId: string | null;
  titulo: string | null;
  descricao: string | null;
  linkMetadados: string | null;
  termosDeUso: string | null;
  nivelCompartilhamentoId: string | null;
  grupoId: string | null;
  temaId: string | null;
  tags: string | null;
  fonteDadosCamada: string | null;
}
