import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from '../repositories/preferences-repository';
import { UserPreference } from '../../enterprise/entities/preferences';

interface GetPreferencesUseCaseRequest {
  COD_USER_ID: string;
}

type GetPreferencesUseCaseResponse = Either<
  null,
  {
    preference: UserPreference;
  }
>;

@Injectable()
export class GetPreferencesUseCase {
  constructor(private preferencesRepository: PreferencesRepository) {}

  async execute({
    COD_USER_ID,
  }: GetPreferencesUseCaseRequest): Promise<GetPreferencesUseCaseResponse> {
    const preference =
      await this.preferencesRepository.findByUserId(COD_USER_ID);

    if (!preference) {
      return left(null);
    }

    return right({ preference });
  }
}
