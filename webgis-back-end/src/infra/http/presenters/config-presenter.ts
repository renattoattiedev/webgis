import { Config } from '@/domain/manager/enterprise/entities/config';

export class ConfigPresenter {
  static toHTTP(config: Config) {
    return {
      id: config.id.toString(),
      grupoOrder: config.configGroupOrder,
      keyOrder: config.configKeyOrder,
      grupoKey: config.configGroupKey,
      key: config.configKey,
      value: config.configValue,
      isSensitive: config.isSensitive,
      criadoEm: config.configCreatedAt,
      usrCriacao: config.configUsuarioCriacao,
      updatedAt: config.configUpdatedAt,
      usrAlteracao: config.configUsuarioUltimaAlteracao,
    };
  }
}
