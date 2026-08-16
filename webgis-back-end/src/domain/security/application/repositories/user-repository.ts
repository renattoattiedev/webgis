import { User } from '../../enterprise/entities/user';

export abstract class UserRepository {
  abstract findById(COD_USER_ID: string): Promise<User | null>;
  abstract findByEmail(DSC_EMAIL: string): Promise<User | null>;
  abstract findByEntraObjectId(
    COD_ENTRA_OBJECT_ID: string,
  ): Promise<User | null>;
  abstract linkEntraAccount(
    COD_USER_ID: string,
    COD_ENTRA_OBJECT_ID: string,
  ): Promise<void>;
  abstract findAllUsers(): Promise<User[]>;
  abstract findAllUsersByProfile(COD_PERFIL_USER: string[]): Promise<User[]>;
  abstract getPerfilById(COD_USER_ID: string): Promise<string | null>;
  abstract create(user: User): Promise<void>;
  abstract updateEmail(COD_USER_ID: string, DSC_EMAIL: string): Promise<void>;
  abstract findByVerificationToken(token: string): Promise<User | null>;
  abstract markEmailAsVerified(userId: string): Promise<void>;
  abstract savePasswordResetToken(
    COD_USER_ID: string,
    DSC_RESET_PASSWORD_TOKEN: string,
    DHS_EXPIRES_RESET_PASSWORD: Date,
  );
  abstract findByPasswordResetToken(
    DSC_RESET_PASSWORD_TOKEN: string,
  ): Promise<User | null>;

  abstract updatePassword(
    COD_USER_ID: string,
    DSC_PASSWORD: string,
  ): Promise<void>;

  abstract updateLastLogin(COD_USER_ID: string): Promise<void>;

  abstract updatePerfilUser(
    COD_USER_ID: string,
    COD_PERFIL_USER: string,
  ): Promise<void>;

  abstract deleteUser(
    COD_USER_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void>;

  abstract recoveryUser(COD_USER_ID: string): Promise<void>;

  abstract clearPasswordResetToken(COD_USER_ID: string): Promise<void>;
}
