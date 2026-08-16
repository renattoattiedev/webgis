// src/infra/database/prisma/mappers/prisma-sicat-bairro-mapper.ts
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SicatBairro } from '@/domain/sicat/enterprise/entities/sicat-bairro';
import { SicatBairro as PrismaSicatBairro } from '@prisma/client';

export class PrismaSicatBairroMapper {
  static toDomain(raw: PrismaSicatBairro): SicatBairro {
    return SicatBairro.create(
      {
        cd_cidade: Number(raw.cd_cidade),
        cd_bairro: Number(raw.cd_bairro),
        dc_bairro: raw.dc_bairro?.toString().trim() || null,
        cd_mun_impressao: raw.cd_mun_impressao
          ? Number(raw.cd_mun_impressao)
          : null,
      },
      new UniqueEntityID(`${raw.cd_cidade}-${raw.cd_bairro}`),
    );
  }
}
