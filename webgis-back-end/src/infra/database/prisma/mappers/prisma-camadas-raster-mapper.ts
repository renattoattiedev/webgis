import { Prisma, CamadasRaster as PrismaCamadasRaster } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CamadasRaster } from '@/domain/camadas-raster/enterprise/entities/camadas-raster';

export class PrismaCamadasRasterMapper {
  static toDomain(raw: PrismaCamadasRaster): CamadasRaster {
    return CamadasRaster.create(
      {
        NOM_NOME: raw.NOM_NOME,
        DSC_FONTE_DADOS_CAMADA: raw.DSC_FONTE_DADOS_CAMADA,
        DSC_TITULO: raw.DSC_TITULO,
        DSC_DESCRICAO: raw.DSC_DESCRICAO,
        DSC_LINK_METADADOS: raw.DSC_LINK_METADADOS,
        TXT_TERMOS_DE_USO: raw.TXT_TERMOS_DE_USO,
        NIVEL_COMPATILHAMENTO: raw.COD_NIVEL_COMPATILHAMENTO.toString(),
        GRUPOS_CAMADAS: raw.COD_GRUPO_ID.toString(),
        TXT_TAGS: raw.TXT_TAGS,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO,
        DHS_EXCLUSAO: raw.DHS_EXCLUSAO,
        FLG_CAMADA_ATIVA: raw.FLG_CAMADA_ATIVA,
        DSC_BOUNDING_BOX: raw.DSC_BOUNDING_BOX || null,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
        BOL_CARREGAMENTO_DEFAULT: raw.BOL_CARREGAMENTO_DEFAULT || false,
        DSC_STATUS: raw.DSC_STATUS,
        NUM_UPLOAD_PROGRESS: raw.NUM_UPLOAD_PROGRESS,
        DSC_SEED_STATUS: raw.DSC_SEED_STATUS,
        NUM_SEED_PROGRESS: raw.NUM_SEED_PROGRESS,
        DSC_COG_PERFIL: raw.DSC_COG_PERFIL,
      },
      new UniqueEntityID(raw.COD_CAMADA_RASTER_ID.toString()),
    );
  }

  static toPrisma(
    camadasRaster: CamadasRaster,
  ): Prisma.CamadasRasterUncheckedCreateInput {
    return {
      COD_CAMADA_RASTER_ID: camadasRaster.id.toString(),
      DSC_FONTE_DADOS_CAMADA: camadasRaster.camadaFonteDadosCamada,
      NOM_NOME: camadasRaster.camadaNome,
      DSC_TITULO: camadasRaster.camadaTitulo,
      DSC_DESCRICAO: camadasRaster.camadaDescricao,
      DSC_LINK_METADADOS: camadasRaster.camadaLinkMetadados,
      TXT_TERMOS_DE_USO: camadasRaster.camadaTermosDeUso,
      COD_NIVEL_COMPATILHAMENTO:
        camadasRaster.camadaNivelCompartilhamento.toString(),
      COD_GRUPO_ID: camadasRaster.camadaGruposCamadas.toString(),
      TXT_TAGS: camadasRaster.camadaTags,
      DSC_BOUNDING_BOX: camadasRaster.camadaBoundingBox || null,
      COD_USUARIO_CRIACAO: camadasRaster.camadaUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: camadasRaster.camadaUsuarioUltimaAlteracao,
      DHS_ULTIMA_ALTERACAO: camadasRaster.updatedAt,
      FLG_CAMADA_ATIVA: camadasRaster.camadaAtiva,
      BOL_CARREGAMENTO_DEFAULT: camadasRaster.camadaCarregamentoDefault,
    };
  }
}
