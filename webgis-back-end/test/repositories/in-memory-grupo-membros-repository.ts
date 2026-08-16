import {
  GrupoMembrosRepository,
  GrupoMembroComUsuario,
} from '@/domain/manager/application/repositories/grupo-membros-repository';
import { GrupoMembro } from '@/domain/manager/enterprise/entities/grupo-membro';

export class InMemoryGrupoMembrosRepository implements GrupoMembrosRepository {
  public itens: GrupoMembro[] = [];
  /** userId -> { nome, email, perfil }, para findManyByGrupo */
  public usuarios = new Map<
    string,
    { nome: string; email: string; perfil: string }
  >();

  async findByGrupoAndUser(
    COD_GRUPO_ID: string,
    COD_USER_ID: string,
  ): Promise<GrupoMembro | null> {
    return (
      this.itens.find(
        (m) => m.grupoId === COD_GRUPO_ID && m.userId === COD_USER_ID,
      ) ?? null
    );
  }

  async findManyByGrupo(
    COD_GRUPO_ID: string,
  ): Promise<GrupoMembroComUsuario[]> {
    return this.itens
      .filter((m) => m.grupoId === COD_GRUPO_ID && m.ativo)
      .map((membro) => ({
        membro,
        nome: this.usuarios.get(membro.userId)?.nome ?? '',
        email: this.usuarios.get(membro.userId)?.email ?? '',
        perfil: this.usuarios.get(membro.userId)?.perfil ?? 'Editor',
      }));
  }

  async findManyByUser(COD_USER_ID: string): Promise<GrupoMembro[]> {
    return this.itens.filter((m) => m.userId === COD_USER_ID && m.ativo);
  }

  async countMembrosByGrupo(COD_GRUPO_ID: string): Promise<number> {
    return this.itens.filter(
      (m) => m.grupoId === COD_GRUPO_ID && m.ativo && m.status === 'membro',
    ).length;
  }

  async create(membro: GrupoMembro): Promise<void> {
    this.itens.push(membro);
  }

  async save(membro: GrupoMembro): Promise<void> {
    const idx = this.itens.findIndex((m) => m.id.equals(membro.id));
    if (idx >= 0) this.itens[idx] = membro;
  }
}
