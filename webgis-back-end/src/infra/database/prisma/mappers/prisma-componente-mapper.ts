import { Prisma, Componente as PrismaComponente } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Componente } from '@/domain/manager/enterprise/entities/componente';

export class PrismaComponenteMapper {
  static toDomain(raw: PrismaComponente): Componente {
    return Componente.create(
      {
        NOM_NOME_COMPONENTE: raw.NOM_NOME_COMPONENTE,
        DSC_DESCRICAO: raw.DSC_DESCRICAO || null,
        JSON_CONFIGURACAO: raw.JSON_CONFIGURACAO,
        FLG_HABILITADO: raw.FLG_HABILITADO,
      },
      new UniqueEntityID(raw.COD_COMPONENTE_ID.toString()),
    );
  }

  static toPrisma(
    componente: Componente,
  ): Prisma.ComponenteUncheckedCreateInput {
    return {
      COD_COMPONENTE_ID: componente.id.toString(),
      NOM_NOME_COMPONENTE: componente.nome,
      DSC_DESCRICAO: componente.descricao,
      JSON_CONFIGURACAO: componente.configuracao,
      FLG_HABILITADO: componente.habilitado,
    };
  }
}
