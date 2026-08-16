import { PrismaClient } from '@prisma/client';
import { GeoserverAPI } from '@/infra/modulos_ext/geoserver/geoserver-api';
import { ConfigService } from '@/config/config.service';
import { MinioAPI } from '@/infra/modulos_ext/minio/minio-api';

const prisma = new PrismaClient();


interface PacoteConceitual {
  NOM_NOME_PACOTE_CONCEITUAL: string;
  DSC_TITULO: string;
  DSC_HOST: string;
  DSC_PORT: string;
  DSC_DATABASE: string;
  DSC_SCHEMA: string;
  DSC_USER: string;
  DSC_PASSWORD: string;
}

export class SeedPacoteConceitual {
  private readonly geoserverAPI: GeoserverAPI;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    const minioAPI = new MinioAPI(configService);
    this.configService = configService;
    this.geoserverAPI = new GeoserverAPI(configService, minioAPI);
  }

  private async initializeWorkspace(): Promise<void> {
    try {
      await this.geoserverAPI.createWorkSpace('content');
      console.log('Workspace "content" created successfully');
    } catch (error) {
      // Check if error is because workspace already exists
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('Workspace "content" already exists, continuing...');
        return;
      }
      throw error;
    }
  }

  private async setupDataStore(pacote: PacoteConceitual): Promise<void> {
    try {
      const dataStore = pacote.NOM_NOME_PACOTE_CONCEITUAL;
      
      // Check if datastore already exists
      const exists = await this.geoserverAPI.dataStoreExists(dataStore);
      if (exists) {
        console.log(`DataStore ${dataStore} already exists, skipping creation`);
        return;
      }

      await this.geoserverAPI.createDataStore(
        pacote.DSC_HOST,
        pacote.DSC_DATABASE,
        pacote.DSC_PORT,
        pacote.DSC_SCHEMA,
        pacote.DSC_USER,
        pacote.DSC_PASSWORD,
        dataStore
      );
      console.log(`DataStore ${dataStore} created successfully`);
    } catch (error) {
      console.error(
        `Failed to create DataStore for package ${pacote.NOM_NOME_PACOTE_CONCEITUAL}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  private async createPacoteConceitual(
    pacote: PacoteConceitual,
    usuarioCriacao: { COD_USER_ID: string }
  ): Promise<void> {
    try {
      await prisma.pacotesConceituais.create({
        data: {
          NOM_NOME_PACOTE_CONCEITUAL: pacote.NOM_NOME_PACOTE_CONCEITUAL,
          COD_USUARIO_CRIACAO: usuarioCriacao.COD_USER_ID.toString(),
          DHS_INCLUSAO: new Date(),
          DSC_TITULO: pacote.DSC_TITULO,
          DSC_HOST: pacote.DSC_HOST,
          DSC_PORT: pacote.DSC_PORT,
          DSC_DATABASE: pacote.DSC_DATABASE,
          DSC_SCHEMA: pacote.DSC_SCHEMA,
          DSC_USER: pacote.DSC_USER,
          DSC_PASSWORD: pacote.DSC_PASSWORD,
        },
      });
      console.log(`Created PacoteConceitual: ${pacote.NOM_NOME_PACOTE_CONCEITUAL}`);
    } catch (error) {
      console.error(
        `Failed to create PacoteConceitual ${pacote.NOM_NOME_PACOTE_CONCEITUAL}:`,
        error instanceof Error ? error.message : error
      );
      throw error;
    }
  }

  async run(): Promise<void> {
    const pacotes: PacoteConceitual[] = [
      {
        NOM_NOME_PACOTE_CONCEITUAL: 'infraestrutura',
        DSC_TITULO: 'Infraestrutura',
        DSC_HOST: 'sgbd-postgis.sistemas.cesan.com.br',
        DSC_PORT: '5433',
        DSC_DATABASE: 'cesan_camadas',
        DSC_SCHEMA: 'public',
        DSC_USER: 'portalgis',
        DSC_PASSWORD: 'giscesan',
      },
      {
        NOM_NOME_PACOTE_CONCEITUAL: 'fiscalizacao',
        DSC_TITULO: 'Fiscalização',
        DSC_HOST: 'sgbd-postgis.sistemas.cesan.com.br',
        DSC_PORT: '5433',
        DSC_DATABASE: 'cesan_camadas',
        DSC_SCHEMA: 'public',
        DSC_USER: 'portalgis',
        DSC_PASSWORD: 'giscesan',
      },
    ];

    try {
      // Find creation user
      const usuarioCriacao = await prisma.user.findFirst();
      if (!usuarioCriacao) {
        throw new Error('No user found for creation attribution');
      }

      // Initialize workspace
      await this.initializeWorkspace();

      // Process each package
      for (const pacote of pacotes) {
        // Check if package already exists
        const pacoteExistente = await prisma.pacotesConceituais.findFirst({
          where: {
            NOM_NOME_PACOTE_CONCEITUAL: pacote.NOM_NOME_PACOTE_CONCEITUAL,
          },
        });

        if (!pacoteExistente) {
          // Create package in database
          await this.createPacoteConceitual(pacote, usuarioCriacao);
          
          // Setup GeoServer datastore
          await this.setupDataStore(pacote);
        } else {
          console.log(
            `PacoteConceitual ${pacote.NOM_NOME_PACOTE_CONCEITUAL} already exists, skipping...`
          );
        }
      }
    } catch (error) {
      console.error('Seed execution failed:', error instanceof Error ? error.message : error);
      throw error;
    }
  }
}

export async function main() {
  const configService = new ConfigService();
  const seed = new SeedPacoteConceitual(configService);

  try {
    await seed.run();
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Seed execution failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error during seed execution:', error);
    process.exitCode = 1;
  });
}