import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRepository } from '@/domain/security/application/repositories/user-repository';
import { User } from '@/domain/security/enterprise/entities/user';
import { PrismaUserMapper } from '../mappers/prisma-user-mapper';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(COD_USER_ID: string | null): Promise<User | null> {
    if (!COD_USER_ID) {
      return null;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        COD_USER_ID: COD_USER_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async findByEmail(DSC_EMAIL: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        DSC_EMAIL,
        DHS_EXCLUSAO: null,
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async findByEntraObjectId(COD_ENTRA_OBJECT_ID: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        COD_ENTRA_OBJECT_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async linkEntraAccount(
    COD_USER_ID: string,
    COD_ENTRA_OBJECT_ID: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
        DHS_EXCLUSAO: null,
      },
      data: {
        COD_ENTRA_OBJECT_ID,
        DSC_AUTH_PROVIDER: 'entra',
      },
    });
  }

  async findAllUsers(): Promise<User[]> {
    const users = await this.prisma.user.findMany();

    return users.map(PrismaUserMapper.toDomain);
  }

  async findAllUsersByProfile(COD_PERFIL_USER: string[]): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      where: {
        COD_PERFIL_USER: {
          in: COD_PERFIL_USER,
        },
        DHS_EXCLUSAO: null,
      },
    });
    return users.map(PrismaUserMapper.toDomain);
  }

  async getPerfilById(COD_USER_ID: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        COD_USER_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!user) {
      return null;
    }

    const userPerfil = await this.prisma.perfilUser.findUnique({
      where: {
        COD_PERFIL_USER: user.COD_PERFIL_USER,
      },
    });

    if (!userPerfil) {
      return null;
    }

    return userPerfil.DSC_PERFIL;
  }

  async create(user: User): Promise<void> {
    const data = PrismaUserMapper.toPrisma(user);

    await this.prisma.user.create({
      data,
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        DSC_EMAIL_VERIFICATION_TOKEN: token,
        DHS_EXCLUSAO: null,
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID: userId,
        DHS_EXCLUSAO: null,
      },
      data: {
        BOL_EMAIL_VERIFIED: true,
        DSC_EMAIL_VERIFICATION_TOKEN: null,
      },
    });
  }

  async savePasswordResetToken(
    COD_USER_ID: string,
    DSC_RESET_PASSWORD_TOKEN: string,
    DHS_EXPIRES_RESET_PASSWORD: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
        DHS_EXCLUSAO: null,
      },
      data: {
        DSC_RESET_PASSWORD_TOKEN,
        DHS_EXPIRES_RESET_PASSWORD,
      },
    });
  }

  async findByPasswordResetToken(
    DSC_RESET_PASSWORD_TOKEN: string,
  ): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        DSC_RESET_PASSWORD_TOKEN,
        DHS_EXCLUSAO: null,
      },
    });

    if (!user) {
      return null;
    }

    return PrismaUserMapper.toDomain(user);
  }

  async updatePassword(
    COD_USER_ID: string,
    DSC_PASSWORD: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
        DHS_EXCLUSAO: null,
      },
      data: {
        DSC_PASSWORD,
      },
    });
  }

  async updateEmail(COD_USER_ID: string, DSC_EMAIL: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
        DHS_EXCLUSAO: null,
      },
      data: {
        DSC_EMAIL,
      },
    });
  }

  async clearPasswordResetToken(COD_USER_ID: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
        DHS_EXCLUSAO: null,
      },
      data: {
        DSC_RESET_PASSWORD_TOKEN: null,
        DHS_EXPIRES_RESET_PASSWORD: null,
      },
    });
  }
  async updateLastLogin(COD_USER_ID: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
      },
      data: {
        DHS_ULTIMA_AUTENTICACAO: new Date(),
        NUM_LOGINS: { increment: 1 },
      },
    });
  }

  async updatePerfilUser(
    COD_USER_ID: string,
    COD_PERFIL_USER: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
      },
      data: {
        COD_PERFIL_USER,
      },
    });
  }

  async deleteUser(
    COD_USER_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
      },
      data: {
        DHS_EXCLUSAO: new Date(),
        COD_USUARIO_EXCLUSAO,
      },
    });
  }

  async recoveryUser(COD_USER_ID: string): Promise<void> {
    await this.prisma.user.update({
      where: {
        COD_USER_ID,
      },
      data: {
        DHS_EXCLUSAO: null,
      },
    });
  }
}
