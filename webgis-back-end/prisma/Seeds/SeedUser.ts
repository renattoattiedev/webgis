import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export class SeedUser {
  private HASH_SALT_LENGTH = 8;

  async hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH);
  }

  async run() {
    const perfilAdmin = await prisma.perfilUser.findFirst({
      where: {
        DSC_PERFIL: 'Admin',
      },
    });

    if (!perfilAdmin || !perfilAdmin.COD_PERFIL_USER) {
      throw new Error(
        'Perfil "Admin" não encontrado ou COD_PERFIL_USER indefinido',
      );
    }

    const hashedPassword = await this.hash('123456');

    const user = {
      NOM_USER: 'User Admin',
      DSC_EMAIL: 'teste@teste.com.br',
      DSC_PASSWORD: hashedPassword,
      COD_PERFIL_USER: perfilAdmin.COD_PERFIL_USER,
      DHS_INCLUSAO: new Date(),
      BOL_EMAIL_VERIFIED: true,
    };

    const existingUser = await prisma.user.findFirst({
      where: { DSC_EMAIL: user.DSC_EMAIL },
    });

    if (!existingUser) {
      await prisma.user.create({ data: user });
    }
  }
}
