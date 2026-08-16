import { UserPreference } from '../../enterprise/entities/preferences';

export abstract class PreferencesRepository {
  abstract findByUserId(COD_USER_ID: string): Promise<UserPreference | null>;
  abstract create(preference: UserPreference): Promise<void>;
  abstract save(preference: UserPreference): Promise<void>;
  abstract delete(preference: UserPreference): Promise<void>;
}
