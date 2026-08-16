import { PrismaClient } from '@prisma/client';
import { gerarSiglaSugerida } from '../../src/domain/manager/application/use-cases/utils/gerar-sigla-sugerida';

const prisma = new PrismaClient();

interface Grupo {
  NOM_NOME_GRUPO: string;
  NOM_NOME_TEMA: string;
}

export class SeedGrupoCamada {
  async run() {
    const grupos: Grupo[] = [
      {
        NOM_NOME_GRUPO: 'Abastecimento de Água',
        NOM_NOME_TEMA: 'Infraestrutura',
      },
      {
        NOM_NOME_GRUPO: 'Esgotamento Sanitário',
        NOM_NOME_TEMA: 'Infraestrutura',
      },
      {
        NOM_NOME_GRUPO: 'Drenagem Pluvial',
        NOM_NOME_TEMA: 'Infraestrutura',
      },
      {
        NOM_NOME_GRUPO: 'Qualidade da Água',
        NOM_NOME_TEMA: 'Ambiental',
      },
      {
        NOM_NOME_GRUPO: 'Localização de Serviços',
        NOM_NOME_TEMA: 'Infraestrutura',
      },
      {
        NOM_NOME_GRUPO: 'Impacto Ambiental',
        NOM_NOME_TEMA: 'Ambiental',
      },
      {
        NOM_NOME_GRUPO: 'Demografia e População',
        NOM_NOME_TEMA: 'Gerencial',
      },
      {
        NOM_NOME_GRUPO: 'Planejamento e Expansão',
        NOM_NOME_TEMA: 'Gerencial',
      },
      {
        NOM_NOME_GRUPO: 'Monitoramento e Manutenção',
        NOM_NOME_TEMA: 'Gerencial',
      },
      {
        NOM_NOME_GRUPO: 'Fiscalização',
        NOM_NOME_TEMA: 'Gerencial',
      },
    ];

    const usuarioCriacao = await prisma.user.findFirst({
      where: {
        DSC_EMAIL: 'teste@teste.com.br',
      },
    });

    if (!usuarioCriacao) {
      throw new Error('Usuário de criação não encontrado');
    }

    const gruposExistentes = await prisma.grupo.findMany({
      select: { SGL_GRUPO_ID: true },
    });
    const siglasExistentes = new Set(
      gruposExistentes.map((g) => g.SGL_GRUPO_ID),
    );

    for (const grupo of grupos) {
      const tema = await prisma.temas.findFirst({
        where: {
          NOM_NOME_TEMA: grupo.NOM_NOME_TEMA,
        },
      });

      if (!tema) {
        throw new Error(`Tema "${grupo.NOM_NOME_TEMA}" não encontrado`);
      }

      const grupoExistente = await prisma.grupo.findFirst({
        where: { NOM_NOME_GRUPO: grupo.NOM_NOME_GRUPO },
      });

      if (!grupoExistente) {
        const siglaGerada = gerarSiglaSugerida(
          grupo.NOM_NOME_GRUPO,
          siglasExistentes,
        );
        siglasExistentes.add(siglaGerada);

        await prisma.grupo.create({
          data: {
            NOM_NOME_GRUPO: grupo.NOM_NOME_GRUPO,
            SGL_GRUPO_ID: siglaGerada,
            COD_USUARIO_CRIACAO: usuarioCriacao.COD_USER_ID,
            COD_TEMA_ID: tema.COD_TEMA_ID,
            DHS_INCLUSAO: new Date(),
          },
        });
      }
    }
  }
}
