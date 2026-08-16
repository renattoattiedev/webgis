import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AtributosRepository } from '@/domain/camadas/application/repositories/atributo-repository';
import { Atributos } from '@/domain/camadas/enterprise/entities/atributos';
import { PrismaAtributosMapper } from '../mappers/prisma-atributos-mapper';

@Injectable()
export class PrismaAtributosRepository implements AtributosRepository {
  constructor(private prisma: PrismaService) {}

  async findById(COD_ATRIBUTO_ID: string): Promise<Atributos | null> {
    const atributos = await this.prisma.atributos.findFirst({
      where: {
        COD_ATRIBUTO_ID,
      },
    });

    if (!atributos) {
      return null;
    }

    return PrismaAtributosMapper.toDomain(atributos);
  }

  async findByNome(NOM_NOME_ATRIBUTO: string): Promise<Atributos | null> {
    const atributos = await this.prisma.atributos.findFirst({
      where: {
        NOM_NOME_ATRIBUTO,
      },
    });

    if (!atributos) {
      return null;
    }

    return PrismaAtributosMapper.toDomain(atributos);
  }

  async findManyByAtributosCamadasId(
    COD_CAMADA_ID,
    manager = false,
  ): Promise<Atributos[]> {
    const whereClause: { [key: string]: any } = {
      COD_CAMADA_ID: COD_CAMADA_ID,
      NOM_NOME_ATRIBUTO: { not: 'id' },
      DHS_EXCLUSAO: null,
    };

    if (!manager) {
      whereClause['FLG_VISIVEL'] = true;
    }

    const atributos = await this.prisma.atributos.findMany({
      where: whereClause,
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return atributos.map(PrismaAtributosMapper.toDomain);
  }

  async findAllByCamadaId(COD_CAMADA_ID: string): Promise<Atributos[]> {
    const atributos = await this.prisma.atributos.findMany({
      where: { COD_CAMADA_ID },
      orderBy: { DHS_INCLUSAO: 'asc' },
    });

    return atributos.map(PrismaAtributosMapper.toDomain);
  }

  async create(atributo: Atributos): Promise<void> {
    const data = PrismaAtributosMapper.toPrisma(atributo);

    await this.prisma.atributos.create({
      data,
    });
  }

  async save(atributo: Atributos): Promise<void> {
    const data = PrismaAtributosMapper.toPrisma(atributo);

    await Promise.all([
      this.prisma.atributos.update({
        where: {
          COD_ATRIBUTO_ID: atributo.id.toString(),
        },
        data,
      }),
    ]);
  }
}
