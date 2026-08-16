import { Prisma, Grupo as PrismaGrupo } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';

export class PrismaGrupoMapper {
  static toDomain(raw: PrismaGrupo): Grupo {
    return Grupo.create(
      {
        NOM_NOME_GRUPO: raw.NOM_NOME_GRUPO,
        SGL_GRUPO_ID: raw.SGL_GRUPO_ID,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        COD_TEMA_ID: raw.COD_TEMA_ID,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
        USUARIO_ALTERACAO: raw.COD_USUARIO_ULTIMA_ALTERACAO?.toString() || null,
        USUARIO_DONO: raw.COD_USUARIO_DONO ?? raw.COD_USUARIO_CRIACAO,
        DSC_VISIBILIDADE: raw.DSC_VISIBILIDADE,
        DSC_POLITICA_PARTICIPACAO: raw.DSC_POLITICA_PARTICIPACAO,
        BOL_MEMBROS_CONTRIBUEM: raw.BOL_MEMBROS_CONTRIBUEM,
      },
      new UniqueEntityID(raw.COD_GRUPO_ID.toString()),
    );
  }

  static toPrisma(grupo: Grupo): Prisma.GrupoUncheckedCreateInput {
    return {
      COD_GRUPO_ID: grupo.id.toString(),
      NOM_NOME_GRUPO: grupo.grupoNome,
      SGL_GRUPO_ID: grupo.grupoSigla,
      COD_TEMA_ID: grupo.grupoTema,
      COD_USUARIO_CRIACAO: grupo.grupoUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: grupo.grupoUsuarioAlteracao,
      COD_USUARIO_DONO: grupo.grupoDono,
      DSC_VISIBILIDADE: grupo.grupoVisibilidade,
      DSC_POLITICA_PARTICIPACAO: grupo.grupoPoliticaParticipacao,
      BOL_MEMBROS_CONTRIBUEM: grupo.grupoMembrosContribuem,
    };
  }
}
