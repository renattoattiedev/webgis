import { TemasRepository } from '@/domain/manager/application/repositories/temas-repository';
import { Temas } from '@/domain/manager/enterprise/entities/temas';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaTemasMapper } from '../mappers/prisma-temas-mapper';

@Injectable()
export class PrismaTemasRepository implements TemasRepository {
  constructor(private prisma: PrismaService) {}

  async findByNome(NOM_NOME_TEMA: string): Promise<Temas | null> {
    const tema = await this.prisma.temas.findFirst({
      where: {
        NOM_NOME_TEMA,
        DHS_EXCLUSAO: null,
      },
    });

    if (!tema) {
      return null;
    }

    return PrismaTemasMapper.toDomain(tema);
  }

  async findById(COD_TEMA_ID: string): Promise<Temas | null> {
    const tema = await this.prisma.temas.findUnique({
      where: {
        COD_TEMA_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!tema) {
      return null;
    }

    return PrismaTemasMapper.toDomain(tema);
  }

  async findManyByTemasId(COD_TEMA_ID: string): Promise<Temas[]> {
    const tema = await this.prisma.temas.findMany({
      where: {
        COD_TEMA_ID,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return tema.map(PrismaTemasMapper.toDomain);
  }

  async create(tema: Temas): Promise<void> {
    const data = PrismaTemasMapper.toPrisma(tema);

    await this.prisma.temas.create({
      data,
    });
  }

  async save(tema: Temas): Promise<void> {
    const data = PrismaTemasMapper.toPrisma(tema);

    await Promise.all([
      this.prisma.temas.update({
        where: {
          COD_TEMA_ID: tema.id.toString(),
        },
        data,
      }),
    ]);
  }

  async delete(
    COD_TEMA_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await this.prisma.temas.update({
      where: {
        COD_TEMA_ID,
      },
      data: {
        DHS_EXCLUSAO: new Date(),
        COD_USUARIO_EXCLUSAO: COD_USUARIO_EXCLUSAO,
      },
    });
  }

  async countByTemasId(COD_TEMA_ID: string): Promise<number> {
    const count = await this.prisma.grupo.count({
      where: {
        COD_TEMA_ID,
        DHS_EXCLUSAO: null,
      },
    });

    return count;
  }
}
