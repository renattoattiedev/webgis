import { Grupo } from '../../enterprise/entities/grupo';

export type GrupoOverviewRow = {
  grupo: Grupo;
  temaNome: string;
  qtdItens: number;
  qtdMembros: number;
  qtdItensPublico: number;
  qtdItensInstitucional: number;
  qtdItensPrivadoTotal: number;
  /** Itens Privado cujo criador é o userId passado para findManyOverview; 0 se userId for null/omitido. */
  qtdItensPrivadoCriador: number;
};

export abstract class GrupoRepository {
  abstract findById(COD_GRUPO_ID: string): Promise<Grupo | null>;
  abstract findByNome(NOM_NOME_GRUPO: string): Promise<Grupo | null>;
  abstract findBySigla(SGL_GRUPO_ID: string): Promise<Grupo | null>;
  abstract findManyByGrupoId(COD_GRUPO_ID: string): Promise<Grupo[]>;
  abstract findManyByGrupoTemaId(COD_TEMA_ID: string): Promise<Grupo[]>;
  /** Todos os grupos ativos (DHS_EXCLUSAO null). */
  abstract findManyAtivos(): Promise<Grupo[]>;
  /** Grupos ativos com nome do tema e contagens (camadas + rasters + mapas ativos; membros status 'membro'); breakdown por nível considera o userId informado (opcional; sem ele, qtdItensPrivadoCriador vem sempre 0). */
  abstract findManyOverview(
    userId?: string | null,
  ): Promise<GrupoOverviewRow[]>;
  abstract create(grupo: Grupo): Promise<void>;
  abstract save(grupo: Grupo): Promise<void>;
  abstract delete(
    COD_GRUPO_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void>;
  abstract countByGruposId(COD_GRUPO_ID: string): Promise<number>;
  /** Reatribui todas as Camadas, CamadasRaster e Mapas ativos de um grupo para outro. Retorna quantos itens foram movidos. */
  abstract moveItensDoGrupo(
    grupoOrigemId: string,
    grupoDestinoId: string,
  ): Promise<number>;
}
