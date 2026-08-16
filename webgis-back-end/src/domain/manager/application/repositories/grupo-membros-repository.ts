import { GrupoMembro } from '../../enterprise/entities/grupo-membro';

export type GrupoMembroComUsuario = {
  membro: GrupoMembro;
  nome: string;
  email: string;
  perfil: string;
};

export abstract class GrupoMembrosRepository {
  /** Busca vínculo grupo+usuário, INCLUINDO soft-deletados (para reativação). */
  abstract findByGrupoAndUser(
    COD_GRUPO_ID: string,
    COD_USER_ID: string,
  ): Promise<GrupoMembro | null>;

  /** Vínculos ativos (membro e pendente) de um grupo, com nome/email do usuário. */
  abstract findManyByGrupo(
    COD_GRUPO_ID: string,
  ): Promise<GrupoMembroComUsuario[]>;

  /** Vínculos ativos (membro e pendente) de um usuário. */
  abstract findManyByUser(COD_USER_ID: string): Promise<GrupoMembro[]>;

  /** Contagem de membros ativos com status 'membro'. */
  abstract countMembrosByGrupo(COD_GRUPO_ID: string): Promise<number>;

  abstract create(membro: GrupoMembro): Promise<void>;
  abstract save(membro: GrupoMembro): Promise<void>;
}
