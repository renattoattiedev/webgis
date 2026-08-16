import { Injectable, Logger } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PitometriaDw } from '../../enterprise/entities/pitometria-dw';
import {
  PitometriaDwRepository,
  FetchPitometriaDwFiltros,
} from '../repositories/pitometria-dw-repository';

type FetchPitometriaDwUseCaseResponse = Either<
  never,
  { medicoes: PitometriaDw[] }
>;

@Injectable()
export class FetchPitometriaDwUseCase {
  private readonly logger = new Logger(FetchPitometriaDwUseCase.name);

  constructor(
    private pitometriaDwRepository: PitometriaDwRepository,
    private prisma: PrismaService,
  ) {}

  async execute(
    filtros: FetchPitometriaDwFiltros,
  ): Promise<FetchPitometriaDwUseCaseResponse> {
    this.logger.debug(`Filtros recebidos: ${JSON.stringify(filtros)}`);

    const medicoes = await this.pitometriaDwRepository.fetchMedicoes(filtros);
    this.logger.debug(`Registros retornados do DW: ${medicoes.length}`);

    if (medicoes.length === 0) {
      return right({ medicoes: [] });
    }

    const codigos = [
      ...new Set(medicoes.map((m) => m.codPontoMedicao).filter(Boolean)),
    ];
    this.logger.debug(`codigos para busca PostGIS: ${JSON.stringify(codigos)}`);

    // Prisma infere strings numéricas ("548") como bigint, causando incompatibilidade
    // com a coluna cod_simp (text). Usa $queryRawUnsafe com valores escapados
    // via literais SQL 'value'::text — os valores vêm do DW (dados controlados).
    const inList = codigos
      .map((c) => `'${String(c).replace(/'/g, "''")}'`)
      .join(',');
    this.logger.debug(`inList PostGIS: ${inList}`);

    const coordenadas = await this.prisma.$queryRawUnsafe<
      { cod_simp: string; longitude: number; latitude: number }[]
    >(`
      SELECT
        cod_simp,
        ST_X(ST_Transform(geometry, 4326)) AS longitude,
        ST_Y(ST_Transform(geometry, 4326)) AS latitude
      FROM "camadas"."pitometria"
      WHERE cod_simp IN (${inList})
        AND dhs_exclusao IS NULL
    `);
    this.logger.debug(
      `Coordenadas PostGIS encontradas: ${JSON.stringify(coordenadas)}`,
    );

    const coordMap = new Map<string, { longitude: number; latitude: number }>();
    for (const c of coordenadas) {
      coordMap.set(c.cod_simp, {
        longitude: c.longitude,
        latitude: c.latitude,
      });
    }

    const medicoesComCoord = medicoes.map((m) => {
      const coord = coordMap.get(m.codPontoMedicao);
      return PitometriaDw.create({
        ...m.props,
        longitude: coord?.longitude ?? null,
        latitude: coord?.latitude ?? null,
      });
    });

    return right({ medicoes: medicoesComCoord });
  }
}
