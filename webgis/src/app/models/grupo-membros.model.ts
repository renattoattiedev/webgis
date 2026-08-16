export interface GrupoOverview {
  id: string;
  nome: string;
  sigla: string;
  temaId: string;
  temaNome: string;
  donoId: string;
  visibilidade: 'membros' | 'organizacao' | 'publico';
  politicaParticipacao: 'convite' | 'solicitacao' | 'aberto';
  membrosContribuem: boolean;
  qtdItens: number;
  qtdItensVisiveis: number;
  qtdMembros: number;
  membership: 'dono' | 'membro' | 'pendente' | null;
  podeGerenciar: boolean;
}

export interface GrupoDetalheInfo extends GrupoOverview {
  donoNome: string;
}

export interface GrupoMembroView {
  userId: string;
  nome: string;
  email: string;
  perfil: string;
  status: 'membro' | 'pendente';
  desde: string;
}

export interface GrupoDetalheResponse {
  grupo: GrupoDetalheInfo;
  membros: GrupoMembroView[];
  pendentes: GrupoMembroView[];
}

export interface GrupoConfigPayload {
  visibilidade?: 'membros' | 'organizacao' | 'publico';
  politicaParticipacao?: 'convite' | 'solicitacao' | 'aberto';
  membrosContribuem?: boolean;
  donoId?: string;
  nome?: string;
  temaId?: string;
}

export interface UsuarioDisponivel {
  id: string;
  nome: string;
  email: string;
}

export interface ItemConteudoGrupo {
  id: string;
  tipo: 'vetorial' | 'raster' | 'mapa';
  tituloCamada?: string;
  tituloMapa?: string;
  nomeCamada?: string;
  nomeMapa?: string;
  nivelCompartilhamento: string;
  temaCamadaNome?: string;
  temaMapaNome?: string;
  grupoCamadaNome?: string;
  grupoMapaNome?: string;
  usrCriacao: string;
  podeEditar: boolean;
  vinculoPrimario: boolean;
}

export interface ItemDisponivelGrupo {
  id: string;
  titulo: string;
  nome: string;
}
