import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import * as sql from 'mssql';
import { EnvService } from '@/infra/env/env.service';

@Injectable()
export class DwDatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DwDatabaseService.name);
  private pool!: sql.ConnectionPool;

  constructor(private env: EnvService) {}

  async onModuleInit() {
    const config: sql.config = {
      server: this.env.get('DW_DB_HOST'),
      user: this.env.get('DW_DB_USER'),
      password: this.env.get('DW_DB_PASSWORD'),
      database: this.env.get('DW_DB_DATABASE'),
      options: {
        trustServerCertificate: true,
        instanceName: this.env.get('DW_DB_INSTANCE'),
        enableArithAbort: true,
      },
      pool: {
        max: 5,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      connectionTimeout: 15000,
      requestTimeout: 60000,
    };

    // Se o DW não está configurado (env vazio), não bloqueia o boot do app.
    if (!config.server) {
      this.logger.warn('DW SQL Server não configurado — rodando sem DW.');
      return;
    }

    try {
      this.pool = await new sql.ConnectionPool(config).connect();
      this.logger.log('DW SQL Server conectado com sucesso');
    } catch (err) {
      // Não derruba a aplicação inteira se o DW externo estiver fora do ar.
      this.logger.warn(
        `DW SQL Server indisponível (${config.server}:1433) — continuando sem DW.`,
      );
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.close();
      this.logger.log('DW SQL Server desconectado');
    }
  }

  getPool(): sql.ConnectionPool {
    return this.pool;
  }
}
