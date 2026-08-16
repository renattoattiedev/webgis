import { PacotesConceituaisRepository } from '@/domain/manager/application/repositories/pacotes-conceituais-repository';
import { PacotesConceituais } from '@/domain/manager/enterprise/entities/pacotes-conceituais';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaPacotesConceituaisMapper } from '../mappers/prisma-pacotes-conceituais-mapper';

@Injectable()
export class PrismaPacotesConceituaisRepository
  implements PacotesConceituaisRepository
{
  constructor(private prisma: PrismaService) {}

  async findByNome(
    NOM_NOME_PACOTE_CONCEITUAL: string,
  ): Promise<PacotesConceituais | null> {
    const pacoteConceitual = await this.prisma.pacotesConceituais.findFirst({
      where: {
        NOM_NOME_PACOTE_CONCEITUAL,
        DHS_EXCLUSAO: null,
      },
    });

    if (!pacoteConceitual) {
      return null;
    }

    return PrismaPacotesConceituaisMapper.toDomain(pacoteConceitual);
  }

  async findById(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<PacotesConceituais | null> {
    if (!COD_PACOTE_CONCEITUAL_ID) {
      throw new Error('COD_PACOTE_CONCEITUAL_ID está indefinido.');
    }
    const pacoteConceitual = await this.prisma.pacotesConceituais.findUnique({
      where: {
        COD_PACOTE_CONCEITUAL_ID,
      },
    });

    if (!pacoteConceitual) {
      return null;
    }

    return PrismaPacotesConceituaisMapper.toDomain(pacoteConceitual);
  }

  async findManyByPacotesConceituaisId(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<PacotesConceituais[]> {
    const pacotesConceituais = await this.prisma.pacotesConceituais.findMany({
      where: {
        COD_PACOTE_CONCEITUAL_ID,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return pacotesConceituais.map(PrismaPacotesConceituaisMapper.toDomain);
  }

  async create(pacoteConceitual: PacotesConceituais): Promise<void> {
    const data = PrismaPacotesConceituaisMapper.toPrisma(pacoteConceitual);

    await this.prisma.pacotesConceituais.create({
      data,
    });
  }

  async save(pacoteConceitual: PacotesConceituais): Promise<void> {
    const data = PrismaPacotesConceituaisMapper.toPrisma(pacoteConceitual);

    await Promise.all([
      this.prisma.pacotesConceituais.update({
        where: {
          COD_PACOTE_CONCEITUAL_ID: pacoteConceitual.id.toString(),
        },
        data,
      }),
    ]);
  }

  async delete(
    COD_PACOTE_CONCEITUAL_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await this.prisma.pacotesConceituais.update({
      where: {
        COD_PACOTE_CONCEITUAL_ID,
      },
      data: {
        DHS_EXCLUSAO: new Date(),
        COD_USUARIO_EXCLUSAO: COD_USUARIO_EXCLUSAO,
      },
    });
  }

  async countByPacotesConceituaisId(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<number> {
    const count = await this.prisma.camadas.count({
      where: {
        COD_PACOTE_CONCEITUAL_ID,
        DHS_EXCLUSAO: null,
      },
    });

    return count;
  }
}
