import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Perfil {
  DSC_PERFIL: string;
}

export class SeedPerfilUser {
  async run() {
    const perfis: Perfil[] = [
      { DSC_PERFIL: 'Admin' },
      { DSC_PERFIL: 'Publicador' },
      { DSC_PERFIL: 'Editor' },
      { DSC_PERFIL: 'Visualizador' },
    ];

    for (const perfil of perfis) {
      const perfilExistente = await prisma.perfilUser.findFirst({
        where: { DSC_PERFIL: perfil.DSC_PERFIL },
      });

      if (!perfilExistente) {
        await prisma.perfilUser.create({ data: perfil });
      }
    }
  }
}
