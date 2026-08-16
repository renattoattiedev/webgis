import { UserRepository } from '@/domain/security/application/repositories/user-repository';
import { User } from '@/domain/security/enterprise/entities/user';

export class InMemoryUserRepository implements UserRepository {
  public itens: User[] = [];

  async findById(COD_USER_ID: string): Promise<User | null> {
    return this.itens.find((u) => u.id.toString() === COD_USER_ID) ?? null;
  }

  async findByEmail(DSC_EMAIL: string): Promise<User | null> {
    return this.itens.find((u) => u.userEmail === DSC_EMAIL) ?? null;
  }

  async findByEntraObjectId(COD_ENTRA_OBJECT_ID: string): Promise<User | null> {
    return (
      this.itens.find((u) => u.userEntraObjectId === COD_ENTRA_OBJECT_ID) ??
      null
    );
  }

  async linkEntraAccount(
    COD_USER_ID: string,
    COD_ENTRA_OBJECT_ID: string,
  ): Promise<void> {
    const user = this.itens.find((u) => u.id.toString() === COD_USER_ID);
    if (user) user.SetUserEntraObjectId(COD_ENTRA_OBJECT_ID);
  }

  async findAllUsers(): Promise<User[]> {
    return this.itens;
  }

  async findAllUsersByProfile(COD_PERFIL_USER: string[]): Promise<User[]> {
    return this.itens.filter(
      (u) =>
        COD_PERFIL_USER.includes(u.userPerfil) && u.userDataExclusao === null,
    );
  }

  async getPerfilById(COD_USER_ID: string): Promise<string | null> {
    return (
      this.itens.find((u) => u.id.toString() === COD_USER_ID)?.userPerfil ??
      null
    );
  }

  async create(user: User): Promise<void> {
    this.itens.push(user);
  }

  async updateEmail(COD_USER_ID: string, DSC_EMAIL: string): Promise<void> {
    const user = this.itens.find((u) => u.id.toString() === COD_USER_ID);
    if (user) user.SetUserEmailUsuario(DSC_EMAIL);
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return (
      this.itens.find((u) => u.userEmailVerificationToken === token) ?? null
    );
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    const user = this.itens.find((u) => u.id.toString() === userId);
    if (user) user.setUserEmailVerified(true);
  }

  async savePasswordResetToken(
    COD_USER_ID: string,
    DSC_RESET_PASSWORD_TOKEN: string,
    DHS_EXPIRES_RESET_PASSWORD: Date,
  ) {
    void DHS_EXPIRES_RESET_PASSWORD;
    const user = this.itens.find((u) => u.id.toString() === COD_USER_ID);
    if (user) user.setUserResetPasswordToken(DSC_RESET_PASSWORD_TOKEN);
  }

  async findByPasswordResetToken(
    DSC_RESET_PASSWORD_TOKEN: string,
  ): Promise<User | null> {
    return (
      this.itens.find(
        (u) => u.userResetPasswordToken === DSC_RESET_PASSWORD_TOKEN,
      ) ?? null
    );
  }

  async updatePassword(
    COD_USER_ID: string,
    DSC_PASSWORD: string,
  ): Promise<void> {
    const user = this.itens.find((u) => u.id.toString() === COD_USER_ID);
    if (user) user.SetUserPasswordUsuario(DSC_PASSWORD);
  }

  async updateLastLogin(COD_USER_ID: string): Promise<void> {
    const user = this.itens.find((u) => u.id.toString() === COD_USER_ID);
    if (user) user.SetUserUltimaAutenticacao(new Date());
  }

  async updatePerfilUser(
    COD_USER_ID: string,
    COD_PERFIL_USER: string,
  ): Promise<void> {
    const user = this.itens.find((u) => u.id.toString() === COD_USER_ID);
    if (user) user.SetUserPerfilUsuario(COD_PERFIL_USER);
  }

  async deleteUser(
    COD_USER_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    void COD_USUARIO_EXCLUSAO;
    this.itens = this.itens.filter((u) => u.id.toString() !== COD_USER_ID);
  }

  async recoveryUser(COD_USER_ID: string): Promise<void> {
    void COD_USER_ID;
  }

  async clearPasswordResetToken(COD_USER_ID: string): Promise<void> {
    const user = this.itens.find((u) => u.id.toString() === COD_USER_ID);
    if (user) user.setUserResetPasswordToken('');
  }
}
