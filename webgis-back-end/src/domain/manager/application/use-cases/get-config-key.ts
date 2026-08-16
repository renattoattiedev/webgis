import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Config } from '../../enterprise/entities/config';
import { ConfigRepository } from '../repositories/config-repository';

interface GetConfigUseCaseRequest {
  DSC_KEY: string;
}

type GetConfigUseCaseResponse = Either<
  null,
  {
    config: Config;
  }
>;

@Injectable()
export class GetConfigUseCase {
  constructor(private configRepository: ConfigRepository) {}

  async execute({
    DSC_KEY,
  }: GetConfigUseCaseRequest): Promise<GetConfigUseCaseResponse> {
    const config = await this.configRepository.findKey(DSC_KEY);

    if (!config) {
      return left(null);
    }

    return right({
      config,
    });
  }
}
