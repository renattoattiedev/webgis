import { Prisma, GrupoMembros as PrismaGrupoMembro } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import {
  GrupoMembro,
  GrupoMembroStatus,
} from '@/domain/manager/enterprise/entities/grupo-membro';

export class PrismaGrupoMembroMapper {
  static toDomain(raw: PrismaGrupoMembro): GrupoMembro {
    return GrupoMembro.create(
      {
        COD_GRUPO_ID: raw.COD_GRUPO_ID,
        COD_USER_ID: raw.COD_USER_ID,
        DSC_STATUS: raw.DSC_STATUS as GrupoMembroStatus,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO,
        USUARIO_ALTERACAO: raw.COD_USUARIO_ULTIMA_ALTERACAO,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO,
        DHS_EXCLUSAO: raw.DHS_EXCLUSAO,
        USUARIO_EXCLUSAO: raw.COD_USUARIO_EXCLUSAO,
      },
      new UniqueEntityID(raw.COD_GRUPO_MEMBRO_ID),
    );
  }

  static toPrisma(
    membro: GrupoMembro,
  ): Prisma.GrupoMembrosUncheckedCreateInput {
    return {
      COD_GRUPO_MEMBRO_ID: membro.id.toString(),
      COD_GRUPO_ID: membro.grupoId,
      COD_USER_ID: membro.userId,
      DSC_STATUS: membro.status,
      COD_USUARIO_CRIACAO: membro.usuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: membro.usuarioAlteracao,
      COD_USUARIO_EXCLUSAO: membro.usuarioExclusao,
      DHS_EXCLUSAO: membro.excluidoEm,
    };
  }
}
