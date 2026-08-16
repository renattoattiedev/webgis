// src/infra/database/prisma/mappers/prisma-sicat-cidade-mapper.ts
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SicatCidade } from '@/domain/sicat/enterprise/entities/sicat-cidades';
import { SicatCidade as PrismaSicatCidade } from '@prisma/client';

export class PrismaSicatCidadeMapper {
  static toDomain(raw: PrismaSicatCidade): SicatCidade {
    return SicatCidade.create(
      {
        cd_cidade: Number(raw.cd_cidade),
        cd_municipio: Number(raw.cd_municipio),
        dc_cidade: raw.dc_cidade?.toString().trim() || null,
      },
      new UniqueEntityID(raw.cd_cidade.toString()),
    );
  }
}
