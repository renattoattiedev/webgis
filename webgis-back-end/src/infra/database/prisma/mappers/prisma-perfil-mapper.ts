import { PerfilUser as PrismaPerfil, Prisma } from '@prisma/client';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { Perfil } from '@/domain/security/enterprise/entities/perfil';

export class PrismaPerfilMapper {
  static toDomain(raw: PrismaPerfil): Perfil {
    return Perfil.create(
      {
        DSC_PERFIL: raw.DSC_PERFIL,
      },
      new UniqueEntityID(raw.COD_PERFIL_USER),
    );
  }

  static toPrisma(perfil: Perfil): Prisma.PerfilUserUncheckedCreateInput {
    return {
      COD_PERFIL_USER: perfil.id.toString(),
      DSC_PERFIL: perfil.descricaoPerfil,
    };
  }
}
