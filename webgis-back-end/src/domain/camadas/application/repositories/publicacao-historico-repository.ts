export type TipoItemPublicacao = 'camada' | 'raster';
export type OperacaoPublicacao = 'publicacao' | 'sobrescrita';
export type StatusPublicacao = 'sucesso' | 'erro';

export interface AtributoAlterado {
  nome: string;
  tipoAnterior: string;
  tipoNovo: string;
}

export interface MudancasPublicacao {
  atributosAdicionados: string[];
  atributosRemovidos: string[];
  atributosAlterados: AtributoAlterado[];
  boundingBoxAnterior: string | null;
  boundingBoxNovo: string | null;
}

export interface RegistroPublicacao {
  tipo: TipoItemPublicacao;
  camadaId: string;
  operacao: OperacaoPublicacao;
  status: StatusPublicacao;
  usuarioId: string;
  errorMsg?: string | null;
  mudancas?: MudancasPublicacao | null;
}

export abstract class PublicacaoHistoricoRepository {
  abstract registrar(registro: RegistroPublicacao): Promise<void>;
}
