import { ComponenteRepository } from '@/domain/manager/application/repositories/componente-repository';
import { Componente } from '@/domain/manager/enterprise/entities/componente';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaComponenteMapper } from '../mappers/prisma-componente-mapper';

@Injectable()
export class PrismaComponenteRepository implements ComponenteRepository {
  constructor(private prisma: PrismaService) {}

  async findByNome(NOM_NOME_COMPONENTE: string): Promise<Componente | null> {
    const componente = await this.prisma.componente.findFirst({
      where: {
        NOM_NOME_COMPONENTE,
      },
    });

    if (!componente) {
      return null;
    }

    return PrismaComponenteMapper.toDomain(componente);
  }

  async findById(COD_COMPONENTE_ID: string): Promise<Componente | null> {
    const componente = await this.prisma.componente.findUnique({
      where: {
        COD_COMPONENTE_ID,
      },
    });

    if (!componente) {
      return null;
    }

    return PrismaComponenteMapper.toDomain(componente);
  }

  async findManyByComponenteId(
    COD_COMPONENTE_ID: string,
  ): Promise<Componente[]> {
    const componentes = await this.prisma.componente.findMany({
      where: {
        COD_COMPONENTE_ID,
      },
      orderBy: {
        NOM_NOME_COMPONENTE: 'asc',
      },
    });

    return componentes.map(PrismaComponenteMapper.toDomain);
  }

  async create(componente: Componente): Promise<void> {
    const data = PrismaComponenteMapper.toPrisma(componente);

    await this.prisma.componente.create({
      data,
    });
  }

  async save(componente: Componente): Promise<void> {
    const data = PrismaComponenteMapper.toPrisma(componente);

    await this.prisma.componente.update({
      where: {
        COD_COMPONENTE_ID: componente.id.toString(),
      },
      data,
    });
  }

  async delete(COD_COMPONENTE_ID: string): Promise<void> {
    await this.prisma.componente.delete({
      where: {
        COD_COMPONENTE_ID,
      },
    });
  }

  async countByComponenteId(COD_COMPONENTE_ID: string): Promise<number> {
    const count = await this.prisma.componente.count({
      where: {
        COD_COMPONENTE_ID,
      },
    });
    return count;
  }

  // Opcional: buscar todos os componentes
  async findAll(): Promise<Componente[]> {
    const componentes = await this.prisma.componente.findMany({
      orderBy: {
        NOM_NOME_COMPONENTE: 'asc',
      },
    });
    return componentes.map(PrismaComponenteMapper.toDomain);
  }
}
