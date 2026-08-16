import {
  GrupoItensAdicionaisRepository,
  TipoItemGrupo,
} from '@/domain/manager/application/repositories/grupo-itens-adicionais-repository';

export class InMemoryGrupoItensAdicionaisRepository
  implements GrupoItensAdicionaisRepository
{
  public vinculos: { tipo: TipoItemGrupo; itemId: string; grupoId: string }[] =
    [];

  async existsVinculo(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<boolean> {
    return this.vinculos.some(
      (v) => v.tipo === tipo && v.itemId === itemId && v.grupoId === grupoId,
    );
  }

  async create(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<void> {
    this.vinculos.push({ tipo, itemId, grupoId });
  }

  async delete(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<void> {
    this.vinculos = this.vinculos.filter(
      (v) => !(v.tipo === tipo && v.itemId === itemId && v.grupoId === grupoId),
    );
  }

  async findGrupoIdsByItem(
    tipo: TipoItemGrupo,
    itemId: string,
  ): Promise<string[]> {
    return this.vinculos
      .filter((v) => v.tipo === tipo && v.itemId === itemId)
      .map((v) => v.grupoId);
  }

  async findItemIdsByGrupo(
    tipo: TipoItemGrupo,
    grupoId: string,
  ): Promise<string[]> {
    return this.vinculos
      .filter((v) => v.tipo === tipo && v.grupoId === grupoId)
      .map((v) => v.itemId);
  }
}
