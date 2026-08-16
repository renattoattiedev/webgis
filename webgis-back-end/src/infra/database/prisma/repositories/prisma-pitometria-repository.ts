import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PitometriaRepository } from '@/domain/pitometria/application/repositories/pitometria-repository';
import { Pitometria } from '@/domain/pitometria/enterprise/entities/pitometria';
import {
  PrismaPitometriaMapper,
  RawPitometria,
} from '../mappers/prisma-pitometria-mapper';

@Injectable()
export class PrismaPitometriaRepository implements PitometriaRepository {
  constructor(private prisma: PrismaService) {}

  // Coordenadas do OpenLayers chegam em EPSG:3857 (Web Mercator).
  // O banco armazena em EPSG:31984 (SIRGAS 2000 / UTM zone 24S).
  // Nas leituras, transformamos de volta para 3857 para o frontend posicionar overlays.

  async findById(id: string): Promise<Pitometria | null> {
    const rows = await this.prisma.$queryRaw<RawPitometria[]>`
      SELECT
        "cod_pitometria_id",
        cod_simp,
        matricula,
        tipo,
        ST_X(ST_Transform(geometry, 3857)) AS longitude,
        ST_Y(ST_Transform(geometry, 3857)) AS latitude,
        cod_usuario_criacao,
        dhs_criacao,
        cod_usuario_atualizacao,
        dhs_atualizacao,
        dhs_exclusao
      FROM "camadas"."pitometria"
      WHERE "cod_pitometria_id" = ${id}
        AND dhs_exclusao IS NULL
    `;

    if (!rows.length) return null;
    return PrismaPitometriaMapper.toDomain(rows[0]);
  }

  async findMany(): Promise<Pitometria[]> {
    const rows = await this.prisma.$queryRaw<RawPitometria[]>`
      SELECT
        "cod_pitometria_id",
        cod_simp,
        matricula,
        tipo,
        ST_X(ST_Transform(geometry, 3857)) AS longitude,
        ST_Y(ST_Transform(geometry, 3857)) AS latitude,
        cod_usuario_criacao,
        dhs_criacao,
        cod_usuario_atualizacao,
        dhs_atualizacao,
        dhs_exclusao
      FROM "camadas"."pitometria"
      WHERE dhs_exclusao IS NULL
      ORDER BY dhs_criacao DESC
    `;

    return rows.map(PrismaPitometriaMapper.toDomain);
  }

  async create(
    pitometria: Pitometria,
    longitude: number,
    latitude: number,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      INSERT INTO "camadas"."pitometria" (
        "cod_pitometria_id",
        cod_simp,
        matricula,
        tipo,
        geometry,
        cod_usuario_criacao,
        dhs_criacao
      ) VALUES (
        ${pitometria.id.toString()},
        ${pitometria.codigoSimp},
        ${pitometria.matricula},
        ${pitometria.tipo}::"camadas"."TipoPitometria",
        ST_Transform(ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 3857), 31984),
        ${pitometria.usuarioCriacao},
        ${pitometria.criadoEm}
      )
    `;
  }

  async save(pitometria: Pitometria): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "camadas"."pitometria"
      SET
        cod_simp                = ${pitometria.codigoSimp},
        matricula               = ${pitometria.matricula},
        tipo                    = ${
          pitometria.tipo
        }::"camadas"."TipoPitometria",
        cod_usuario_atualizacao = ${pitometria.usuarioAtualizacao},
        dhs_atualizacao         = ${pitometria.atualizadoEm}
      WHERE "cod_pitometria_id" = ${pitometria.id.toString()}
    `;
  }

  async saveGeometria(
    id: string,
    longitude: number,
    latitude: number,
    usuarioAtualizacao: string,
  ): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "camadas"."pitometria"
      SET
        geometry                = ST_Transform(ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 3857), 31984),
        cod_usuario_atualizacao = ${usuarioAtualizacao},
        dhs_atualizacao         = NOW()
      WHERE "cod_pitometria_id" = ${id}
    `;
  }

  async delete(id: string, usuarioExclusao: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE "camadas"."pitometria"
      SET
        dhs_exclusao            = NOW(),
        cod_usuario_atualizacao = ${usuarioExclusao},
        dhs_atualizacao         = NOW()
      WHERE "cod_pitometria_id" = ${id}
    `;
  }
}
