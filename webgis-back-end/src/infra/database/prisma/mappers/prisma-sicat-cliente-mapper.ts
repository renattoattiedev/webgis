import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { SicatCliente } from '@/domain/sicat/enterprise/entities/sicat-cliente';
import { SicatCliente as PrismaSicatCliente } from '@prisma/client';

export class PrismaSicatClienteMapper {
  static toDomain(raw: PrismaSicatCliente): SicatCliente {
    return SicatCliente.create(
      {
        nome_cliente_interno: raw.nome_cliente_interno?.toString() || null,
        cpf_cnpj: raw.cpf_cnpj?.toString().trim() || null,
        cd_cliente: Number(raw.cd_cliente),
        tipo_cliente: raw.tipo_cliente?.toString().trim() || null,
      },
      new UniqueEntityID(raw.cd_cliente.toString()),
    );
  }
}
