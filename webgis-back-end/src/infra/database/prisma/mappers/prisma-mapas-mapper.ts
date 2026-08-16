import { Prisma, Mapas as PrismaMapas } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Mapas } from '@/domain/mapas/enterprise/entities/mapas';

export class PrismaMapasMapper {
  static toDomain(raw: PrismaMapas): Mapas {
    return Mapas.create(
      {
        NOM_NOME_MAPA: raw.NOM_NOME_MAPA,
        DSC_TITULO: raw.DSC_TITULO,
        DSC_DESCRICAO: raw.DSC_DESCRICAO,
        DSC_BOUNDING_BOX: raw.DSC_BOUNDING_BOX || null,
        GRUPOS_MAPAS: raw.COD_GRUPO_ID.toString(),
        NIVEL_COMPATILHAMENTO: raw.COD_NIVEL_COMPATILHAMENTO.toString(),
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
        COD_USUARIO_ULTIMA_ALTERACAO:
          raw.COD_USUARIO_ULTIMA_ALTERACAO?.toString() || null,
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO,
      },
      new UniqueEntityID(raw.COD_MAPA_ID.toString()),
    );
  }

  static toPrisma(mapa: Mapas): Prisma.MapasUncheckedCreateInput {
    return {
      COD_MAPA_ID: mapa.id.toString(),
      NOM_NOME_MAPA: mapa.mapaNome,
      DSC_TITULO: mapa.mapaTitulo,
      DSC_DESCRICAO: mapa.mapaDescricao,
      DSC_BOUNDING_BOX: mapa.mapaBoundingBox || null,
      COD_GRUPO_ID: mapa.mapaGrupo.toString(),
      COD_NIVEL_COMPATILHAMENTO: mapa.mapaNivelCompartilhamento.toString(),
      COD_USUARIO_CRIACAO: mapa.mapaUsuarioCriacao.toString(),
      COD_USUARIO_ULTIMA_ALTERACAO: mapa.mapaUsuarioUltimaAlteracao.toString(),
      DHS_INCLUSAO: mapa.createdAt,
      DHS_ULTIMA_ALTERACAO: mapa.updatedAt,
      DHS_EXCLUSAO: mapa.deletedAt,
    };
  }
}
