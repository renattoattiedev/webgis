import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PreferencesRepository } from '@/domain/user/application/repositories/preferences-repository';
import { PrismaPreferencesUserMapper } from '../mappers/prisma-preferences-user-mapper';
import { UserPreference } from '@/domain/user/enterprise/entities/preferences';

@Injectable()
export class PrismaPreferencesUserRepository implements PreferencesRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(COD_USER_ID: string): Promise<UserPreference | null> {
    const raw = await (this.prisma as any).userPreference.findFirst({
      where: { COD_USER_ID },
      orderBy: [{ DHS_ULTIMA_ALTERACAO: 'desc' }, { DHS_INCLUSAO: 'desc' }],
    });

    if (!raw) return null;
    return PrismaPreferencesUserMapper.toDomain(raw as any);
  }

  async create(preference: UserPreference): Promise<void> {
    const data = PrismaPreferencesUserMapper.toPrisma(preference);
    await (this.prisma as any).userPreference.create({ data });
  }

  async save(preference: UserPreference): Promise<void> {
    await (this.prisma as any).userPreference.update({
      where: { COD_USER_PREFERENCE_ID: preference.userPreferenceId },
      data: {
        SELECTED_LAYERS: preference.selectedLayers ?? null,
        ZOOM: preference.zoom ?? null,
        CENTER_X: preference.centerX ?? null,
        EXTENT: preference.extent ?? null,
        DHS_ULTIMA_ALTERACAO: (preference.updatedAt as any) ?? new Date(),
      },
    });
  }

  async delete(preference: UserPreference): Promise<void> {
    await (this.prisma as any).userPreference.delete({
      where: { COD_USER_PREFERENCE_ID: preference.userPreferenceId },
    });
  }
}
