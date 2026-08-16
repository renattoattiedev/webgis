import { Injectable, Logger } from '@nestjs/common';
import * as sql from 'mssql';
import { PitometriaDw } from '@/domain/pitometria-dw/enterprise/entities/pitometria-dw';
import {
  FetchPitometriaDwFiltros,
  FetchPitometriaDwSpatialFiltros,
  PitometriaDwRepository,
} from '@/domain/pitometria-dw/application/repositories/pitometria-dw-repository';
import { DwDatabaseService } from '../../dw/dw-database.service';
import { PitometriaDwMapper } from '../mappers/pitometria-dw-mapper';

@Injectable()
export class MssqlPitometriaDwRepository implements PitometriaDwRepository {
  private readonly logger = new Logger(MssqlPitometriaDwRepository.name);

  constructor(private dwDatabase: DwDatabaseService) {}

  async fetchMedicoes(
    filtros: FetchPitometriaDwFiltros,
  ): Promise<PitometriaDw[]> {
    const pool = this.dwDatabase.getPool();
    const request = pool.request();

    let query = `
      SELECT
        [CodPontoMedicao], [NomePontoMedicao], [LocalPontoMedicao], [TipoPontoMedicao],
        [SituacaoVazao], [TipoMedicao], [TipoRegistro], [CodMedidorPressao],
        [CotaMedidor], [InstalacaoMedidor], [DiametroRede], [DiametroMedidor],
        [Matricula], [DataRegistro], [Ano], [Mes], [Dia], [Hora], [Minuto],
        [PressaoMaxima], [PressaoMedia], [PressaoMinima], [Amplitude],
        [Piezometrica], [DesvioPadrao], [QtdeRegistros], [NumeroOS],
        [HouveOcorrencia], [Observacao]
      FROM [dwcesan].[dbo].[VW_CCD_PRESSAO]
      WHERE 1=1
    `;

    if (filtros.codSimp) {
      query += ' AND CAST([CodPontoMedicao] AS NVARCHAR(50)) = @codSimp';
      request.input('codSimp', sql.NVarChar, filtros.codSimp);
    }

    if (filtros.matricula) {
      query += ' AND [Matricula] = @matricula';
      request.input('matricula', sql.NVarChar, filtros.matricula);
    }

    if (filtros.numeroOs) {
      query += ' AND [NumeroOS] = @numeroOs';
      request.input('numeroOs', sql.NVarChar, filtros.numeroOs);
    }

    if (filtros.dataInicio) {
      query += ' AND [DataRegistro] >= @dataInicio';
      request.input('dataInicio', sql.DateTime, filtros.dataInicio);
    }

    if (filtros.dataFim) {
      query += ' AND [DataRegistro] <= @dataFim';
      request.input('dataFim', sql.DateTime, filtros.dataFim);
    }

    query += ' ORDER BY [DataRegistro] DESC';

    this.logger.debug(`Query SQL Server: ${query}`);
    const result = await request.query(query);
    this.logger.debug(
      `Registros SQL Server: ${
        result.recordset.length
      }, primeiro: ${JSON.stringify(result.recordset[0])}`,
    );
    return result.recordset.map(PitometriaDwMapper.toDomain);
  }

  async fetchMedicoesByCodigos(
    filtros: FetchPitometriaDwSpatialFiltros,
  ): Promise<PitometriaDw[]> {
    if (!filtros.codigos.length) return [];

    const pool = this.dwDatabase.getPool();
    const request = pool.request();

    // Sanitize: keep only alphanumeric and dash to prevent injection
    const codigosLiterais = filtros.codigos
      .map((c) => `'${String(c).replace(/[^a-zA-Z0-9\-]/g, '')}'`)
      .join(',');

    // Agrupa por CodPontoMedicao para retornar um registro por ponto,
    // evitando que o limite de 5000 linhas seja preenchido por um único ponto
    // com muitos registros e ignore os demais pontos do polígono.
    let query = `
      SELECT
        [CodPontoMedicao],
        MAX([NomePontoMedicao])   AS NomePontoMedicao,
        MAX([LocalPontoMedicao])  AS LocalPontoMedicao,
        MAX([TipoPontoMedicao])   AS TipoPontoMedicao,
        MAX([SituacaoVazao])      AS SituacaoVazao,
        MAX([TipoMedicao])        AS TipoMedicao,
        MAX([TipoRegistro])       AS TipoRegistro,
        MAX([CodMedidorPressao])  AS CodMedidorPressao,
        AVG([CotaMedidor])        AS CotaMedidor,
        MAX([InstalacaoMedidor])  AS InstalacaoMedidor,
        MAX([DiametroRede])       AS DiametroRede,
        MAX([DiametroMedidor])    AS DiametroMedidor,
        MAX([Matricula])          AS Matricula,
        MAX([DataRegistro])       AS DataRegistro,
        MAX([Ano])                AS Ano,
        MAX([Mes])                AS Mes,
        MAX([Dia])                AS Dia,
        MAX([Hora])               AS Hora,
        MAX([Minuto])             AS Minuto,
        MAX([PressaoMaxima])      AS PressaoMaxima,
        AVG([PressaoMedia])       AS PressaoMedia,
        MIN([PressaoMinima])      AS PressaoMinima,
        AVG([Amplitude])          AS Amplitude,
        AVG([Piezometrica])       AS Piezometrica,
        AVG([DesvioPadrao])       AS DesvioPadrao,
        SUM([QtdeRegistros])      AS QtdeRegistros,
        MAX([NumeroOS])           AS NumeroOS,
        MAX([HouveOcorrencia])    AS HouveOcorrencia,
        MAX([Observacao])         AS Observacao
      FROM [dwcesan].[dbo].[VW_CCD_PRESSAO]
      WHERE CAST([CodPontoMedicao] AS NVARCHAR(50)) IN (${codigosLiterais})
    `;

    if (filtros.dataInicio) {
      query += ' AND [DataRegistro] >= @dataInicio';
      request.input('dataInicio', sql.DateTime, filtros.dataInicio);
    }

    if (filtros.dataFim) {
      query += ' AND [DataRegistro] <= @dataFim';
      request.input('dataFim', sql.DateTime, filtros.dataFim);
    }

    // Filtro de tipo de medição baseado em TipoPontoMedicao:
    // P = Medidor de Pressão | M = Macromedidor (vazão) | H = Hidrômetro (vazão)
    const incluiPressao = filtros.medicaoPressao !== false;
    const incluiVazao = filtros.medicaoVazao !== false;
    if (!incluiPressao && !incluiVazao) {
      query += ' AND 1=0';
    } else if (incluiPressao && !incluiVazao) {
      query += " AND [TipoPontoMedicao] = 'P - Medidor de Pressão'";
    } else if (!incluiPressao && incluiVazao) {
      query +=
        " AND [TipoPontoMedicao] IN ('M - Macromedidor', 'H - Hidrômetro')";
    }

    // Filtro de fonte de dados por TipoRegistro
    if (filtros.fontesDados !== undefined) {
      if (filtros.fontesDados.length === 0) {
        query += ' AND 1=0';
      } else {
        const paramNames = filtros.fontesDados.map((_, i) => `@fonte${i}`);
        filtros.fontesDados.forEach((f, i) => {
          request.input(`fonte${i}`, sql.NVarChar(100), f);
        });
        query += ` AND [TipoRegistro] IN (${paramNames.join(',')})`;
      }
    }

    // Filtro de ocorrência operacional
    if (filtros.incluirOcorrencia === false) {
      query += ' AND [HouveOcorrencia] = 0';
    }

    query += ' GROUP BY [CodPontoMedicao]';
    query += ' ORDER BY MAX([DataRegistro]) DESC';

    this.logger.debug(`Query spatial SQL Server: ${query}`);
    const result = await request.query(query);
    this.logger.debug(
      `Registros spatial SQL Server: ${result.recordset.length}`,
    );
    return result.recordset.map(PitometriaDwMapper.toDomain);
  }
}
