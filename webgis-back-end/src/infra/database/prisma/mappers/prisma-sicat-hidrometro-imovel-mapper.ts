import { SicatHidrometroImovel as PrismaSicatHidrometroImovel } from '@prisma/client';
import { SicatHidrometroImovel } from '@/domain/sicat/enterprise/entities/sicat-hidrometro-imovel';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export class PrismaSicatHidrometroImovelMapper {
  static toDomain(raw: PrismaSicatHidrometroImovel): SicatHidrometroImovel {
    return SicatHidrometroImovel.create(
      {
        matriculaImovel: Number(raw.matricula_imovel),
        codigoHidrometro: raw.codigo_hidrometro,
      },
      new UniqueEntityID(`${raw.matricula_imovel}-${raw.codigo_hidrometro}`),
    );
  }
}
