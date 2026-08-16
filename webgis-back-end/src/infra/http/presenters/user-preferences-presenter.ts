import { UserPreference } from '@/domain/user/enterprise/entities/preferences';

export class UserPreferencesPresenter {
  static toHTTP(pref: UserPreference) {
    return {
      id: pref.userPreferenceId,
      userId: pref.userId,
      selectedLayers: pref.selectedLayers ?? null,
      zoom: pref.zoom ?? null,
      centerX: pref.centerX ?? null,
      extent: pref.extent ?? null,
      createdAt: pref.createdAt,
      updatedAt: pref.updatedAt,
    };
  }
}
