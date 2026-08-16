import { Prisma, Temas as PrismaTemas } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Temas } from '@/domain/manager/enterprise/entities/temas';

export class PrismaTemasMapper {
  static toDomain(raw: PrismaTemas): Temas {
    return Temas.create(
      {
        NOM_NOME_TEMA: raw.NOM_NOME_TEMA,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO || null,
        USUARIO_ALTERACAO: raw.COD_USUARIO_ULTIMA_ALTERACAO || null,
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO,
      },
      new UniqueEntityID(raw.COD_TEMA_ID.toString()),
    );
  }

  static toPrisma(tema: Temas): Prisma.TemasUncheckedCreateInput {
    return {
      COD_TEMA_ID: tema.id.toString(),
      NOM_NOME_TEMA: tema.temaNome,
      COD_USUARIO_CRIACAO: tema.temaUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: tema.temaUsuarioAlteracao,
    };
  }
}
