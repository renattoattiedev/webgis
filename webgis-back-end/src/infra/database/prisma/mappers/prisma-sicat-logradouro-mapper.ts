// src/infra/database/prisma/mappers/prisma-sicat-logradouro-mapper.ts
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SicatLogradouro } from '@/domain/sicat/enterprise/entities/sicat-logradouro';
import { SicatLogradouro as PrismaSicatLogradouro } from '@prisma/client';

export class PrismaSicatLogradouroMapper {
  static toDomain(raw: PrismaSicatLogradouro): SicatLogradouro {
    return SicatLogradouro.create(
      {
        cd_cidade: Number(raw.cd_cidade),
        cd_logradouro: Number(raw.cd_logradouro),
        sigla_logradouro: raw.sigla_logradouro?.toString().trim() || null,
        dc_logradouro: raw.dc_logradouro?.toString().trim() || null,
      },
      new UniqueEntityID(`${raw.cd_cidade}-${raw.cd_logradouro}`),
    );
  }
}
