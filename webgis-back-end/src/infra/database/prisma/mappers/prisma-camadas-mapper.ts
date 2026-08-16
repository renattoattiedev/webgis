import { Prisma, Camadas as PrismaCamadas } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';

export class PrismaCamadasMapper {
  static toDomain(raw: PrismaCamadas): Camadas {
    return Camadas.create(
      {
        NOM_NOME: raw.NOM_NOME,
        DSC_TITULO: raw.DSC_TITULO,
        DSC_DESCRICAO: raw.DSC_DESCRICAO,
        DSC_LINK_METADADOS: raw.DSC_LINK_METADADOS,
        TXT_TERMOS_DE_USO: raw.TXT_TERMOS_DE_USO,
        NIVEL_COMPATILHAMENTO: raw.COD_NIVEL_COMPATILHAMENTO.toString(),
        GRUPOS_CAMADAS: raw.COD_GRUPO_ID.toString(),
        TXT_TAGS: raw.TXT_TAGS,
        PACOTES_CONCEITUAIS: raw.COD_PACOTE_CONCEITUAL_ID.toString(),
        DSC_FONTE_DADOS_CAMADA: raw.DSC_FONTE_DADOS_CAMADA,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO,
        DHS_EXCLUSAO: raw.DHS_EXCLUSAO,
        FLG_CAMADA_ATIVA: raw.FLG_CAMADA_ATIVA,
        DSC_BOUNDING_BOX: raw.DSC_BOUNDING_BOX || null,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
        BOL_CARREGAMENTO_DEFAULT: raw.BOL_CARREGAMENTO_DEFAULT || false,
        DSC_STATUS: raw.DSC_STATUS,
        DSC_ERROR_MSG: raw.DSC_ERROR_MSG,
      },
      new UniqueEntityID(raw.COD_CAMADA_ID.toString()),
    );
  }

  static toPrisma(camada: Camadas): Prisma.CamadasUncheckedCreateInput {
    return {
      COD_CAMADA_ID: camada.id.toString(),
      NOM_NOME: camada.camadaNome,
      DSC_TITULO: camada.camadaTitulo,
      DSC_DESCRICAO: camada.camadaDescricao,
      DSC_LINK_METADADOS: camada.camadaLinkMetadados,
      TXT_TERMOS_DE_USO: camada.camadaTermosDeUso,
      COD_NIVEL_COMPATILHAMENTO: camada.camadaNivelCompartilhamento.toString(),
      COD_GRUPO_ID: camada.camadaGruposCamadas.toString(),
      TXT_TAGS: camada.camadaTags,
      COD_PACOTE_CONCEITUAL_ID: camada.camadaPacotesConceituais.toString(),
      DSC_FONTE_DADOS_CAMADA: camada.camadaFonteDadosCamada,
      DSC_BOUNDING_BOX: camada.camadaBoundingBox || null,
      COD_USUARIO_CRIACAO: camada.camadaUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: camada.camadaUsuarioUltimaAlteracao,
      DHS_ULTIMA_ALTERACAO: camada.updatedAt,
      FLG_CAMADA_ATIVA: camada.camadaAtiva,
      BOL_CARREGAMENTO_DEFAULT: camada.camadaCarregamentoDefault || false,
      DSC_STATUS: camada.camadaStatus,
      DSC_ERROR_MSG: camada.camadaErrorMsg,
    };
  }
}
