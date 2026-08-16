import {
  GrupoRepository,
  GrupoOverviewRow,
} from '@/domain/manager/application/repositories/grupo-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';

export class InMemoryGrupoRepository implements GrupoRepository {
  public itens: Grupo[] = [];
  /** temaId -> nome, para o overview */
  public temas = new Map<string, string>();
  /** grupoId -> qtd de conteúdos, para o overview */
  public qtdItensPorGrupo = new Map<string, number>();
  /** grupoId -> qtd de membros, para o overview */
  public qtdMembrosPorGrupo = new Map<string, number>();
  /** grupoId -> qtd de itens Público, para o overview */
  public qtdItensPublicoPorGrupo = new Map<string, number>();
  /** grupoId -> qtd de itens Institucional, para o overview */
  public qtdItensInstitucionalPorGrupo = new Map<string, number>();
  /** grupoId -> qtd total de itens Privado, para o overview */
  public qtdItensPrivadoTotalPorGrupo = new Map<string, number>();
  /** "grupoId:userId" -> qtd de itens Privado criados por esse usuário, para o overview */
  public qtdItensPrivadoPorCriador = new Map<string, number>();
  public excluidos = new Set<string>();

  private ativos(): Grupo[] {
    return this.itens.filter((g) => !this.excluidos.has(g.id.toString()));
  }

  async findByNome(NOM_NOME_GRUPO: string): Promise<Grupo | null> {
    return this.ativos().find((g) => g.grupoNome === NOM_NOME_GRUPO) ?? null;
  }

  async findBySigla(SGL_GRUPO_ID: string): Promise<Grupo | null> {
    return this.ativos().find((g) => g.grupoSigla === SGL_GRUPO_ID) ?? null;
  }

  async findById(COD_GRUPO_ID: string): Promise<Grupo | null> {
    return this.ativos().find((g) => g.id.toString() === COD_GRUPO_ID) ?? null;
  }

  async findManyByGrupoId(COD_GRUPO_ID: string): Promise<Grupo[]> {
    return this.ativos().filter((g) => g.id.toString() === COD_GRUPO_ID);
  }

  async findManyByGrupoTemaId(COD_TEMA_ID: string): Promise<Grupo[]> {
    return this.ativos().filter((g) => g.grupoTema === COD_TEMA_ID);
  }

  async findManyAtivos(): Promise<Grupo[]> {
    return this.ativos();
  }

  async findManyOverview(userId?: string | null): Promise<GrupoOverviewRow[]> {
    return this.ativos().map((grupo) => {
      const grupoId = grupo.id.toString();
      return {
        grupo,
        temaNome: this.temas.get(grupo.grupoTema) ?? '',
        qtdItens: this.qtdItensPorGrupo.get(grupoId) ?? 0,
        qtdMembros: this.qtdMembrosPorGrupo.get(grupoId) ?? 0,
        qtdItensPublico: this.qtdItensPublicoPorGrupo.get(grupoId) ?? 0,
        qtdItensInstitucional:
          this.qtdItensInstitucionalPorGrupo.get(grupoId) ?? 0,
        qtdItensPrivadoTotal:
          this.qtdItensPrivadoTotalPorGrupo.get(grupoId) ?? 0,
        qtdItensPrivadoCriador: userId
          ? this.qtdItensPrivadoPorCriador.get(`${grupoId}:${userId}`) ?? 0
          : 0,
      };
    });
  }

  async create(grupo: Grupo): Promise<void> {
    this.itens.push(grupo);
  }

  async save(grupo: Grupo): Promise<void> {
    const idx = this.itens.findIndex((g) => g.id.equals(grupo.id));
    if (idx >= 0) this.itens[idx] = grupo;
  }

  async delete(
    COD_GRUPO_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    void COD_USUARIO_EXCLUSAO;
    this.excluidos.add(COD_GRUPO_ID);
  }

  async countByGruposId(COD_GRUPO_ID: string): Promise<number> {
    return this.qtdItensPorGrupo.get(COD_GRUPO_ID) ?? 0;
  }

  /** Registra as chamadas de moveItensDoGrupo para os testes do use-case (grupoOrigemId -> grupoDestinoId). */
  public movimentacoes: { origem: string; destino: string }[] = [];

  async moveItensDoGrupo(
    grupoOrigemId: string,
    grupoDestinoId: string,
  ): Promise<number> {
    const qtd = this.qtdItensPorGrupo.get(grupoOrigemId) ?? 0;
    this.movimentacoes.push({ origem: grupoOrigemId, destino: grupoDestinoId });
    this.qtdItensPorGrupo.set(
      grupoDestinoId,
      (this.qtdItensPorGrupo.get(grupoDestinoId) ?? 0) + qtd,
    );
    this.qtdItensPorGrupo.set(grupoOrigemId, 0);
    return qtd;
  }
}
