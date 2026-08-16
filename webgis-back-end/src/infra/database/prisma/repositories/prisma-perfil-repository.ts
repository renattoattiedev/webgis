import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PerfilRepository } from '@/domain/security/application/repositories/perfil-repository';
import { Perfil } from '@/domain/security/enterprise/entities/perfil';
import { PrismaPerfilMapper } from '../mappers/prisma-perfil-mapper';

@Injectable()
export class PrismaPerfilRepository implements PerfilRepository {
  constructor(private prisma: PrismaService) {}

  async findById(COD_PERFIL_USER: string): Promise<Perfil | null> {
    const perfil = await this.prisma.perfilUser.findUnique({
      where: {
        COD_PERFIL_USER,
      },
    });

    if (!perfil) {
      return null;
    }

    return PrismaPerfilMapper.toDomain(perfil);
  }

  async findByPerfil(DSC_PERFIL: string): Promise<Perfil | null> {
    const perfil = await this.prisma.perfilUser.findFirst({
      where: {
        DSC_PERFIL,
      },
    });

    if (!perfil) {
      return null;
    }

    return PrismaPerfilMapper.toDomain(perfil);
  }

  async findManyPerfil(): Promise<Perfil[]> {
    const perfil = await this.prisma.perfilUser.findMany();

    return perfil.map(PrismaPerfilMapper.toDomain);
  }

  async create(perfil: Perfil): Promise<void> {
    const data = PrismaPerfilMapper.toPrisma(perfil);

    await this.prisma.perfilUser.create({
      data,
    });
  }
}
