import { Prisma, Config as PrismaConfig } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Config } from '@/domain/manager/enterprise/entities/config';

export class PrismaConfigMapper {
  static toDomain(raw: PrismaConfig): Config {
    return Config.create(
      {
        NUM_GRUPO_ORDER: raw.NUM_GRUPO_ORDER,
        NUM_KEY_ORDER: raw.NUM_KEY_ORDER,
        DSC_GRUPO_KEY: raw.DSC_GRUPO_KEY,
        DSC_KEY: raw.DSC_KEY,
        DSC_VALUE: raw.DSC_VALUE || null,
        FLG_SENSIVEL: raw.FLG_SENSIVEL || false,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        COD_USUARIO_CRIACAO: raw.COD_USUARIO_CRIACAO.toString(),
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO,
        COD_USUARIO_ULTIMA_ALTERACAO:
          raw.COD_USUARIO_ULTIMA_ALTERACAO?.toString() || null,
        COD_USUARIO_EXCLUSAO: null,
        DHS_EXCLUSAO: null,
      },
      new UniqueEntityID(raw.COD_CONFIG_ID.toString()),
    );
  }

  static toPrisma(config: Config): Prisma.ConfigUncheckedCreateInput {
    return {
      COD_CONFIG_ID: config.id.toString(),
      NUM_GRUPO_ORDER: config.configGroupOrder,
      NUM_KEY_ORDER: config.configKeyOrder,
      DSC_GRUPO_KEY: config.configGroupKey,
      DSC_KEY: config.configKey,
      DSC_VALUE: config.configValue ?? '',
      FLG_SENSIVEL: config.isSensitive,
      COD_USUARIO_CRIACAO: config.configUsuarioCriacao,
      COD_USUARIO_ULTIMA_ALTERACAO: config.configUsuarioUltimaAlteracao,
    };
  }
}
