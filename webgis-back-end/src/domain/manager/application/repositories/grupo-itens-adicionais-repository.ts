export type TipoItemGrupo = 'camada' | 'raster' | 'mapa';

export abstract class GrupoItensAdicionaisRepository {
  abstract existsVinculo(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<boolean>;

  abstract create(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<void>;

  abstract delete(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<void>;

  /** Ids de todos os grupos adicionais vinculados a um item — usado para popular a seleção atual nos diálogos de edição. */
  abstract findGrupoIdsByItem(
    tipo: TipoItemGrupo,
    itemId: string,
  ): Promise<string[]>;

  /** Ids dos itens de um tipo vinculados a um grupo como adicional — usado para excluir do picker "+ Adicionar item" os itens já vinculados. */
  abstract findItemIdsByGrupo(
    tipo: TipoItemGrupo,
    grupoId: string,
  ): Promise<string[]>;
}
