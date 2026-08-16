import { PrismaClient } from '@prisma/client';
import { gerarSiglaSugerida } from '../../src/domain/manager/application/use-cases/utils/gerar-sigla-sugerida';

const prisma = new PrismaClient();

async function main() {
  // Sem filtro de DHS_EXCLUSAO: SGL_GRUPO_ID sera UNIQUE NOT NULL na tabela
  // inteira (Task 4), entao grupos com soft-delete tambem precisam de sigla.
  const grupos = await prisma.grupo.findMany({
    orderBy: { DHS_INCLUSAO: 'asc' },
    select: { COD_GRUPO_ID: true, NOM_NOME_GRUPO: true, SGL_GRUPO_ID: true },
  });

  const siglasExistentes = new Set(
    grupos.map((g) => g.SGL_GRUPO_ID).filter((s): s is string => !!s),
  );

  let atualizados = 0;
  for (const grupo of grupos) {
    if (grupo.SGL_GRUPO_ID) continue;

    const sigla = gerarSiglaSugerida(grupo.NOM_NOME_GRUPO, siglasExistentes);
    siglasExistentes.add(sigla);

    await prisma.grupo.update({
      where: { COD_GRUPO_ID: grupo.COD_GRUPO_ID },
      data: { SGL_GRUPO_ID: sigla },
    });
    atualizados += 1;
    console.log(`${grupo.NOM_NOME_GRUPO} -> ${sigla}`);
  }

  console.log(`Backfill concluído: ${atualizados} grupo(s) atualizado(s).`);
}

main()
  .catch((error) => {
    console.error('Erro no backfill de sigla de grupo:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
