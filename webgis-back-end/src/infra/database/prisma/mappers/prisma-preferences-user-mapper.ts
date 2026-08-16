import { Prisma } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { UserPreference } from '@/domain/user/enterprise/entities/preferences';

export class PrismaPreferencesUserMapper {
  static toDomain(raw: any): UserPreference {
    return UserPreference.create(
      {
        COD_USER_ID: raw.COD_USER_ID,
        SELECTED_LAYERS: raw.SELECTED_LAYERS as any,
        ZOOM: raw.ZOOM ?? null,
        CENTER_X: raw.CENTER_X ?? null,
        EXTENT: raw.EXTENT as any,
        DHS_INCLUSAO: raw.DHS_INCLUSAO,
        DHS_ULTIMA_ALTERACAO: raw.DHS_ULTIMA_ALTERACAO ?? null,
      },
      new UniqueEntityID(raw.COD_USER_PREFERENCE_ID.toString()),
    );
  }

  static toPrisma(preference: UserPreference): any {
    return {
      COD_USER_PREFERENCE_ID: preference.userPreferenceId,
      COD_USER_ID: preference.userId,
      SELECTED_LAYERS: preference.selectedLayers ?? null,
      ZOOM: preference.zoom ?? null,
      CENTER_X: preference.centerX ?? null,
      EXTENT: preference.extent ?? null,
      DHS_INCLUSAO: preference.createdAt as any,
      DHS_ULTIMA_ALTERACAO: preference.updatedAt as any,
    };
  }
}
