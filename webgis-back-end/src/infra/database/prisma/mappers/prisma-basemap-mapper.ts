import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Basemap } from '@/domain/basemaps/enterprise/entities/basemap';

export class PrismaBasemapMapper {
  static toDomain(raw: any): Basemap {
    return Basemap.create(
      {
        NOM_NOME_BASEMAP: raw.NOM_NOME_BASEMAP,
        DSC_THUMBNAIL: raw.DSC_THUMBNAIL ?? null,
        DSC_SOURCE: raw.DSC_SOURCE,
        JSON_WMS_PARAMS: raw.JSON_WMS_PARAMS ?? null,
        NUM_ORDEM: raw.NUM_ORDEM ?? 0,
        BOL_DEFAULT: raw.BOL_DEFAULT ?? false,
        FLG_ATIVO: raw.FLG_ATIVO ?? true,
        COD_USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO,
        COD_USUARIO_ULTIMA_ALTERACAO: raw.COD_USUARIO_ULTIMA_ALTERACAO ?? null,
        COD_USUARIO_EXCLUSAO: raw.COD_USUARIO_EXCLUSAO ?? null,
        DHS_EXCLUSAO: raw.DHS_EXCLUSAO ?? null,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO ?? null,
      },
      new UniqueEntityID(raw.COD_BASEMAP_ID.toString()),
    );
  }

  static toPrisma(basemap: Basemap): any {
    return {
      COD_BASEMAP_ID: basemap.id.toString(),
      NOM_NOME_BASEMAP: basemap.basemapNome,
      DSC_THUMBNAIL: basemap.basemapThumbnail,
      DSC_SOURCE: basemap.basemapSource,
      JSON_WMS_PARAMS: basemap.basemapWmsParams,
      NUM_ORDEM: basemap.basemapOrdem,
      BOL_DEFAULT: basemap.basemapDefault,
      FLG_ATIVO: basemap.basemapAtivo,
      COD_USUARIO_CRIACAO: basemap.basemapUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: basemap.basemapUsuarioAlteracao,
      COD_USUARIO_EXCLUSAO: basemap.basemapUsuarioExclusao,
      DHS_EXCLUSAO: basemap.deletedAt,
    };
  }
}
