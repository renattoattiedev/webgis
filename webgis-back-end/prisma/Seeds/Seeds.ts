import { SeedPerfilUser } from './SeedPerfilUser';
import { SeedUser } from './SeedUser';
import { SeedTema } from './SeedTema';
import { SeedGrupoCamada } from './SeedGrupoCamada';
import { SeedNivelCompartilhamento } from './SeedNivelCompartilhamento';
import { main as seedPacoteConceitual } from './SeedPacoteConceitual';
import { SeedConfig } from './SeedConfig';
import { SeedComponente } from './SeedComponente';

async function main() {
  const seedPerfilUser = new SeedPerfilUser();
  await seedPerfilUser.run();

  const seedUser = new SeedUser();
  await seedUser.run();

  const seedConfig = new SeedConfig();
  await seedConfig.run();

  const seedComponente = new SeedComponente();
  await seedComponente.run();

  const seedTema = new SeedTema();
  await seedTema.run();

  const seedGrupoCamada = new SeedGrupoCamada();
  await seedGrupoCamada.run();

  const seedNivelCompartilhamento = new SeedNivelCompartilhamento();
  await seedNivelCompartilhamento.run();

  await seedPacoteConceitual();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
