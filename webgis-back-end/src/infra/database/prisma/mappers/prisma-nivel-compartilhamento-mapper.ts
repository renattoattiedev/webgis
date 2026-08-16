import {
  Prisma,
  NivelCompartilhamento as PrismaNivelCompartilhamento,
} from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NivelCompartilhamento } from '@/domain/manager/enterprise/entities/nivel-compartilhamento';

export class PrismaNivelCompartilhamentoMapper {
  static toDomain(raw: PrismaNivelCompartilhamento): NivelCompartilhamento {
    return NivelCompartilhamento.create(
      {
        DSC_NIVEL_COMPATILHAMENTO: raw.DSC_NIVEL_COMPATILHAMENTO,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
      },
      new UniqueEntityID(raw.COD_NIVEL_COMPATILHAMENTO.toString()),
    );
  }

  static toPrisma(
    nivelCompartilhamento: NivelCompartilhamento,
  ): Prisma.NivelCompartilhamentoUncheckedCreateInput {
    return {
      COD_NIVEL_COMPATILHAMENTO: nivelCompartilhamento.id.toString(),
      DSC_NIVEL_COMPATILHAMENTO:
        nivelCompartilhamento.nivelCompartilhamentoDescricao,
      COD_USUARIO_CRIACAO:
        nivelCompartilhamento.nivelCompartilhamentoUsuarioCriacao,
    };
  }
}
