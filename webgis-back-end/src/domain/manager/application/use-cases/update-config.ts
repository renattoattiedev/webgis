import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Config } from '../../enterprise/entities/config';
import { ConfigRepository } from '../repositories/config-repository';

interface ConfigUseCaseRequest {
  COD_CONFIG_ID: string;
  DSC_VALUE: string;
  COD_USUARIO_ULTIMA_ALTERACAO: string;
}

type ConfigCamadaUseCaseResponse = Either<
  null,
  {
    config: Config;
  }
>;

@Injectable()
export class UpdateConfiglUseCase {
  constructor(private configRepository: ConfigRepository) {}

  async execute({
    COD_CONFIG_ID,
    DSC_VALUE,
    COD_USUARIO_ULTIMA_ALTERACAO,
  }: ConfigUseCaseRequest): Promise<ConfigCamadaUseCaseResponse> {
    const config = await this.configRepository.findById(
      COD_CONFIG_ID.toString(),
    );

    if (!config) {
      throw new Error('Config not found');
    }

    config.setConfigValue(DSC_VALUE);
    config.setCamadaUsuarioAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);

    if (COD_USUARIO_ULTIMA_ALTERACAO) {
      config.setCamadaUsuarioAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);
    }

    await this.configRepository.save(config);

    return right({
      config,
    });
  }
}
