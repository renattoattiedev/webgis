import { BadRequestException, Injectable } from '@nestjs/common';
import { ColunasTabelaProvider } from '@/domain/camadas/application/repositories/colunas-tabela-provider';
import { ColunaTabela } from '@/domain/camadas/application/services/reconciliar-atributos.service';
import { MetadadosPostgis } from '@/infra/modulos_ext/metadados-postgis/metadados-postgis';
import { FetchPacotesConceituaisUseCase } from '@/domain/manager/application/use-cases/fetch-pacotes-conceituais';

@Injectable()
export class PostgisColunasTabelaProvider implements ColunasTabelaProvider {
  constructor(
    private metadadosPostgis: MetadadosPostgis,
    private fetchPacotesConceituais: FetchPacotesConceituaisUseCase,
  ) {}

  async listarColunas(
    COD_PACOTE_CONCEITUAL_ID: string,
    tableName: string,
  ): Promise<ColunaTabela[]> {
    const pacote = await this.fetchPacotesConceituais.execute({
      COD_PACOTE_CONCEITUAL_ID,
    });

    if (pacote.isLeft()) {
      throw new BadRequestException('Pacote conceitual não encontrado');
    }

    const p = pacote.value.pacotesConceituais;

    const colunas = await this.metadadosPostgis.getTableColumns({
      host: p.pacoteConceitualHost,
      database: p.pacoteConceitualDatabase,
      port: p.pacoteConceitualPort,
      schema: p.pacoteConceitualSchema,
      user: p.pacoteConceitualUser,
      password: p.pacoteConceitualPassword,
      tableName,
    });

    return colunas.map((c) => ({
      column_name: c.column_name,
      data_type: c.data_type,
      character_maximum_length: c.character_maximum_length ?? null,
    }));
  }
}
