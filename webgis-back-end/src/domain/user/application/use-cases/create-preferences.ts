import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from '../repositories/preferences-repository';
import { UserPreference } from '../../enterprise/entities/preferences';

interface CreatePreferencesUseCaseRequest {
  COD_USER_ID: string;
  SELECTED_LAYERS?: any;
  ZOOM?: number | null;
  CENTER_X?: number | null;
  EXTENT?: any;
  DHS_INCLUSAO?: Date;
}

type CreatePreferencesUseCaseResponse = Either<
  Error,
  {
    preference: UserPreference;
  }
>;

@Injectable()
export class CreatePreferencesUseCase {
  constructor(private preferencesRepository: PreferencesRepository) {}

  async execute({
    COD_USER_ID,
    SELECTED_LAYERS,
    ZOOM,
    CENTER_X,
    EXTENT,
    DHS_INCLUSAO,
  }: CreatePreferencesUseCaseRequest): Promise<CreatePreferencesUseCaseResponse> {
    const existing = await this.preferencesRepository.findByUserId(COD_USER_ID);
    if (existing) {
      return left(new Error('Preferências já existentes para este usuário'));
    }

    const preference = UserPreference.create({
      COD_USER_ID,
      SELECTED_LAYERS: SELECTED_LAYERS ?? null,
      ZOOM: ZOOM ?? null,
      CENTER_X: CENTER_X ?? null,
      EXTENT: EXTENT ?? null,
      DHS_INCLUSAO: DHS_INCLUSAO ?? new Date(),
      DHS_ULTIMA_ALTERACAO: null,
    });

    await this.preferencesRepository.create(preference);

    return right({ preference });
  }
}
