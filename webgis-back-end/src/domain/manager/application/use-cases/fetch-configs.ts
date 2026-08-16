import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Config } from '../../enterprise/entities/config';
import { ConfigRepository } from '../repositories/config-repository';

type FetchConfigsUseCaseResponse = Either<
  [],
  {
    config: Config[];
  }
>;

@Injectable()
export class FetchConfigsUseCase {
  constructor(private configRepository: ConfigRepository) {}

  async execute(): Promise<FetchConfigsUseCaseResponse> {
    const config = await this.configRepository.findManyKeys();

    return right({
      config,
    });
  }
}
