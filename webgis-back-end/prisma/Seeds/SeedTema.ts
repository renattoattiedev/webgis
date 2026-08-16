import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Tema {
  NOM_NOME_TEMA: string;
}

export class SeedTema {
  async run() {
    const temas: Tema[] = [
      { NOM_NOME_TEMA: 'Infraestrutura' },
      { NOM_NOME_TEMA: 'Ambiental' },
      { NOM_NOME_TEMA: 'Gerencial' },
    ];

    const usuarioCriacao = await prisma.user.findFirst({
      where: {
        DSC_EMAIL: 'teste@teste.com.br',
      },
    });

    if (!usuarioCriacao) {
      throw new Error('Usuário de criação não encontrado');
    }

    for (const tema of temas) {
      const temaExistente = await prisma.temas.findFirst({
        where: { NOM_NOME_TEMA: tema.NOM_NOME_TEMA },
      });

      if (!temaExistente) {
        await prisma.temas.create({
          data: {
            NOM_NOME_TEMA: tema.NOM_NOME_TEMA,
            COD_USUARIO_CRIACAO: usuarioCriacao.COD_USER_ID,
            DHS_INCLUSAO: new Date(),
          },
        });
      }
    }
  }
}
