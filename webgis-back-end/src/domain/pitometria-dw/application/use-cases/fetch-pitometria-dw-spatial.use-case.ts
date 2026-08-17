import { Injectable, Logger } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { PrismaService } from '@/infra/database/prisma/prisma.service';
import { PitometriaDw } from '../../enterprise/entities/pitometria-dw';
import { PitometriaDwRepository } from '../repositories/pitometria-dw-repository';

export interface FetchPitometriaDwSpatialInput {
  polygonGeoJSON: string;
  dataInicio?: Date;
  dataFim?: Date;
  medicaoPressao?: boolean;
  medicaoVazao?: boolean;
  fontesDados?: string[];
  incluirOcorrencia?: boolean;
}

type FetchPitometriaDwSpatialResponse = Either<
  never,
  { medicoes: PitometriaDw[] }
>;

@Injectable()
export class FetchPitometriaDwSpatialUseCase {
  private readonly logger = new Logger(FetchPitometriaDwSpatialUseCase.name);

  constructor(
    private pitometriaDwRepository: PitometriaDwRepository,
    private prisma: PrismaService,
  ) {}

  async execute(
    input: FetchPitometriaDwSpatialInput,
  ): Promise<FetchPitometriaDwSpatialResponse> {
    this.logger.debug(
      `Consulta espacial: dataInicio=${input.dataInicio}, dataFim=${input.dataFim}`,
    );

    // ST_Intersects para encontrar pontos de pitometria dentro ou na borda do polígono
    const pontos = await this.prisma.$queryRawUnsafe<
      {
        cod_simp: string;
        longitude: number;
        latitude: number;
      }[]
    >(
      `
      SELECT
        cod_simp,
        ST_X(ST_Transform(geometry, 4326)) AS longitude,
        ST_Y(ST_Transform(geometry, 4326)) AS latitude
      FROM "camadas"."pitometria"
      WHERE ST_Intersects(geometry, ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326), 31983))
        AND dhs_exclusao IS NULL
    `,
      input.polygonGeoJSON,
    );

    this.logger.debug(`Pontos dentro do polígono: ${pontos.length}`);
    this.logger.debug(
      `cod_simps encontrados: ${JSON.stringify(pontos.map((p) => p.cod_simp))}`,
    );

    if (pontos.length === 0) {
      return right({ medicoes: [] });
    }

    const codigos = [...new Set(pontos.map((p) => p.cod_simp).filter(Boolean))];
    this.logger.debug(`Códigos únicos para DW: ${JSON.stringify(codigos)}`);
    const coordMap = new Map<string, { longitude: number; latitude: number }>();
    for (const p of pontos) {
      coordMap.set(p.cod_simp, {
        longitude: p.longitude,
        latitude: p.latitude,
      });
    }

    const medicoes = await this.pitometriaDwRepository.fetchMedicoesByCodigos({
      codigos,
      dataInicio: input.dataInicio,
      dataFim: input.dataFim,
      medicaoPressao: input.medicaoPressao,
      medicaoVazao: input.medicaoVazao,
      fontesDados: input.fontesDados,
      incluirOcorrencia: input.incluirOcorrencia,
    });

    this.logger.debug(`Medições retornadas do DW: ${medicoes.length}`);

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
