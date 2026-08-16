import { NivelCompartilhamentoRepository } from '@/domain/manager/application/repositories/nivel-compartilhamento-repository';
import { NivelCompartilhamento } from '@/domain/manager/enterprise/entities/nivel-compartilhamento';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaNivelCompartilhamentoMapper } from '../mappers/prisma-nivel-compartilhamento-mapper';

@Injectable()
export class PrismaNivelCompartilhamentoRepository
  implements NivelCompartilhamentoRepository
{
  constructor(private prisma: PrismaService) {}

  async findByDSC(
    DSC_NIVEL_COMPATILHAMENTO: string,
  ): Promise<NivelCompartilhamento | null> {
    const nivelCompartilhamento =
      await this.prisma.nivelCompartilhamento.findFirst({
        where: {
          DSC_NIVEL_COMPATILHAMENTO,
        },
      });

    if (!nivelCompartilhamento) {
      return null;
    }

    return PrismaNivelCompartilhamentoMapper.toDomain(nivelCompartilhamento);
  }

  async findById(
    COD_NIVEL_COMPATILHAMENTO: string,
  ): Promise<NivelCompartilhamento | null> {
    const nivelCompartilhamento =
      await this.prisma.nivelCompartilhamento.findUnique({
        where: {
          COD_NIVEL_COMPATILHAMENTO,
        },
      });

    if (!nivelCompartilhamento) {
      return null;
    }

    return PrismaNivelCompartilhamentoMapper.toDomain(nivelCompartilhamento);
  }

  async findManyByNivelCompartilhamentoId(
    COD_NIVEL_COMPATILHAMENTO: string,
  ): Promise<NivelCompartilhamento[]> {
    const nivelCompartilhamento =
      await this.prisma.nivelCompartilhamento.findMany({
        where: {
          COD_NIVEL_COMPATILHAMENTO,
        },
        orderBy: {
          DHS_INCLUSAO: 'desc',
        },
      });

    return nivelCompartilhamento.map(
      PrismaNivelCompartilhamentoMapper.toDomain,
    );
  }

  async create(nivelCompartilhamento: NivelCompartilhamento): Promise<void> {
    const data = PrismaNivelCompartilhamentoMapper.toPrisma(
      nivelCompartilhamento,
    );

    await this.prisma.nivelCompartilhamento.create({
      data,
    });
  }
}
