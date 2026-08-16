import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private envService: EnvService) {
    const dbUrl = `postgresql://${envService.get('DB_USER')}:${envService.get(
      'DB_PASSWORD',
    )}@${envService.get('DB_HOST')}:${envService.get(
      'DB_PORT',
    )}/${envService.get('DB_NAME')}?schema=${envService.get(
      'DB_SCHEMA',
    )}&connection_limit=10&pool_timeout=20&connect_timeout=10&statement_timeout=30000`;

    console.log('🔗 Database URL:', dbUrl.replace(/:([^:@]+)@/, ':****@'));

    super({
      log: ['warn', 'error'],
      // ✅ Configurações otimizadas de conexão
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      // ✅ 3. Configurar timeout menor para conexão inicial
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), 10000),
        ),
      ]);

      console.log('✅ Successfully connected to the database');
      console.log(`📊 Connection pool: max 10 connections, timeout 20s`);

      // ✅ 4. Configurar cleanup de conexões idle
      setInterval(async () => {
        await this.$executeRaw`SELECT 1`; // Keep-alive query
      }, 30000); // A cada 30 segundos
    } catch (error) {
      console.error('❌ Failed to connect to the database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    console.log('🔌 Disconnecting from database...');
    await this.$disconnect();
  }

  // ✅ 5. Método para verificar health do banco
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // ✅ 6. Método para obter estatísticas de conexão
  async getConnectionStats() {
    try {
      const result = await this.$queryRaw<Array<{ count: number }>>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE usename = '${this.envService.get('DB_USER')}' 
        AND state = 'active'
      `;
      return result[0]?.count || 0;
    } catch {
      return 0;
    }
  }
}
