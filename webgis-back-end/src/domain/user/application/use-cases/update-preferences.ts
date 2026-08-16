import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from '../repositories/preferences-repository';

interface UpdatePreferencesUseCaseRequest {
  COD_USER_ID: string;
  SELECTED_LAYERS?: any;
  ZOOM?: number | null;
  CENTER_X?: number | null;
  EXTENT?: any;
}

@Injectable()
export class UpdatePreferencesUseCase {
  constructor(private preferencesRepository: PreferencesRepository) {}

  async execute({
    COD_USER_ID,
    SELECTED_LAYERS,
    ZOOM,
    CENTER_X,
    EXTENT,
  }: UpdatePreferencesUseCaseRequest) {
    const preference =
      await this.preferencesRepository.findByUserId(COD_USER_ID);
    if (!preference) {
      throw new Error('Preferências do usuário não encontradas');
    }

    if (SELECTED_LAYERS !== undefined) {
      preference.setSelectedLayers(SELECTED_LAYERS);
    }
    if (ZOOM !== undefined) {
      preference.setZoom(ZOOM);
    }
    if (CENTER_X !== undefined) {
      preference.setCenterX(CENTER_X);
    }
    if (EXTENT !== undefined) {
      preference.setExtent(EXTENT);
    }

    preference.setUpdatedAt(new Date());
    await this.preferencesRepository.save(preference);
  }
}
