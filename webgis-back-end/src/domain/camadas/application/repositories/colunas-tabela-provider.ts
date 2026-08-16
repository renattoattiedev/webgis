import { ColunaTabela } from '../services/reconciliar-atributos.service';

export abstract class ColunasTabelaProvider {
  /** Lê as colunas da tabela/view no PostGIS do pacote conceitual informado. */
  abstract listarColunas(
    COD_PACOTE_CONCEITUAL_ID: string,
    tableName: string,
  ): Promise<ColunaTabela[]>;
}
