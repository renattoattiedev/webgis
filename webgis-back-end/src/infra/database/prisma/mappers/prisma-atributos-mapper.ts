import { Prisma, Atributos as PrismaAtributos } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Atributos } from '@/domain/camadas/enterprise/entities/atributos';

export class PrismaAtributosMapper {
  static toDomain(raw: PrismaAtributos): Atributos {
    return Atributos.create(
      {
        COD_CAMADA_ID: raw.COD_CAMADA_ID.toString(),
        NOM_NOME_ATRIBUTO: raw.NOM_NOME_ATRIBUTO,
        DSC_LABEL_ATRIBUTO: raw.DSC_LABEL_ATRIBUTO || '',
        DSC_TIPO: raw.DSC_TIPO || '',
        NUM_TAMANHO: Number(raw.NUM_TAMANHO) || 0,
        FLG_VISIVEL: raw.FLG_VISIVEL,
        TXT_DESCRICAO: raw.TXT_DESCRICAO || '',
        NUM_ORDEM_RENDERIZACAO: raw.NUM_ORDEM_RENDERIZACAO || undefined,
        COD_USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        COD_USUARIO_ULTIMA_ALTERACAO: raw.COD_USUARIO_ULTIMA_ALTERACAO || '',
        COD_USUARIO_EXCLUSAO: raw.COD_USUARIO_EXCLUSAO,
        DHS_EXCLUSAO: raw.DHS_EXCLUSAO,
      },
      new UniqueEntityID(raw.COD_ATRIBUTO_ID.toString()),
    );
  }

  static toPrisma(atributos: Atributos): Prisma.AtributosUncheckedCreateInput {
    return {
      COD_ATRIBUTO_ID: atributos.id.toString(),
      COD_CAMADA_ID: atributos.camadaId.toString(),
      NOM_NOME_ATRIBUTO: atributos.atributoNome,
      DSC_LABEL_ATRIBUTO: atributos.atributoLabel,
      DSC_TIPO: atributos.atributoTipo,
      NUM_TAMANHO: atributos.atributoTamanho.toString(),
      FLG_VISIVEL: atributos.atributoVisivel,
      TXT_DESCRICAO: atributos.atributoDescricao,
      NUM_ORDEM_RENDERIZACAO: atributos.atributoOrdemRenderizacao,
      COD_USUARIO_CRIACAO: atributos.atributoUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: atributos.atributoUsuarioUltimaAlteracao,
      DHS_ULTIMA_ALTERACAO: atributos.updatedAt,
      COD_USUARIO_EXCLUSAO: atributos.atributoUsuarioExclusao,
      DHS_EXCLUSAO: atributos.deletedAt,
    };
  }
}
