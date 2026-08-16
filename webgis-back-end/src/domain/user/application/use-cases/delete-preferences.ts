import { Injectable } from '@nestjs/common';
import { PreferencesRepository } from '../repositories/preferences-repository';

interface DeletePreferencesUseCaseRequest {
  COD_USER_ID: string;
}

@Injectable()
export class DeletePreferencesUseCase {
  constructor(private preferencesRepository: PreferencesRepository) {}

  async execute({ COD_USER_ID }: DeletePreferencesUseCaseRequest) {
    const preference =
      await this.preferencesRepository.findByUserId(COD_USER_ID);
    if (!preference) {
      throw new Error('Preferências do usuário não encontradas');
    }

    await this.preferencesRepository.delete(preference);
  }
}
