import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NivelCompartilhamento {
  DSC_NIVEL_COMPATILHAMENTO: string;
}

export class SeedNivelCompartilhamento {
  async run() {
    const niveis: NivelCompartilhamento[] = [
      { DSC_NIVEL_COMPATILHAMENTO: 'Público' },
      { DSC_NIVEL_COMPATILHAMENTO: 'Privado' },
      { DSC_NIVEL_COMPATILHAMENTO: 'Institucional' },
    ];

    const usuarioCriacao = await prisma.user.findFirst({
      where: {
        DSC_EMAIL: 'teste@teste.com.br',
      },
    });

    if (!usuarioCriacao) {
      throw new Error('Usuário de criação não encontrado');
    }

    for (const nivel of niveis) {
      const nivelExistente = await prisma.nivelCompartilhamento.findFirst({
        where: { DSC_NIVEL_COMPATILHAMENTO: nivel.DSC_NIVEL_COMPATILHAMENTO },
      });

      if (!nivelExistente) {
        await prisma.nivelCompartilhamento.create({
          data: {
            DSC_NIVEL_COMPATILHAMENTO: nivel.DSC_NIVEL_COMPATILHAMENTO,
            COD_USUARIO_CRIACAO: usuarioCriacao.COD_USER_ID,
            DHS_INCLUSAO: new Date(),
          },
        });
      }
    }
  }
}
