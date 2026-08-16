import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  GrupoMembrosRepository,
  GrupoMembroComUsuario,
} from '@/domain/manager/application/repositories/grupo-membros-repository';
import { GrupoMembro } from '@/domain/manager/enterprise/entities/grupo-membro';
import { PrismaGrupoMembroMapper } from '../mappers/prisma-grupo-membro-mapper';

@Injectable()
export class PrismaGrupoMembrosRepository implements GrupoMembrosRepository {
  constructor(private prisma: PrismaService) {}

  async findByGrupoAndUser(
    COD_GRUPO_ID: string,
    COD_USER_ID: string,
  ): Promise<GrupoMembro | null> {
    // inclui soft-deletados de propósito (reativação)
    const raw = await this.prisma.grupoMembros.findFirst({
      where: { COD_GRUPO_ID, COD_USER_ID },
    });
    return raw ? PrismaGrupoMembroMapper.toDomain(raw) : null;
  }

  async findManyByGrupo(
    COD_GRUPO_ID: string,
  ): Promise<GrupoMembroComUsuario[]> {
    const raws = await this.prisma.grupoMembros.findMany({
      where: { COD_GRUPO_ID, DHS_EXCLUSAO: null },
      include: { user: { include: { perfil_user: true } } },
      orderBy: { DHS_INCLUSAO: 'asc' },
    });
    return raws.map((raw) => ({
      membro: PrismaGrupoMembroMapper.toDomain(raw),
      nome: raw.user.NOM_USER,
      email: raw.user.DSC_EMAIL,
      perfil: raw.user.perfil_user.DSC_PERFIL,
    }));
  }

  async findManyByUser(COD_USER_ID: string): Promise<GrupoMembro[]> {
    const raws = await this.prisma.grupoMembros.findMany({
      where: { COD_USER_ID, DHS_EXCLUSAO: null },
    });
    return raws.map(PrismaGrupoMembroMapper.toDomain);
  }

  async countMembrosByGrupo(COD_GRUPO_ID: string): Promise<number> {
    return this.prisma.grupoMembros.count({
      where: { COD_GRUPO_ID, DSC_STATUS: 'membro', DHS_EXCLUSAO: null },
    });
  }

  async create(membro: GrupoMembro): Promise<void> {
    await this.prisma.grupoMembros.create({
      data: PrismaGrupoMembroMapper.toPrisma(membro),
    });
  }

  async save(membro: GrupoMembro): Promise<void> {
    const data = PrismaGrupoMembroMapper.toPrisma(membro);
    await this.prisma.grupoMembros.update({
      where: { COD_GRUPO_MEMBRO_ID: membro.id.toString() },
      data,
    });
  }
}
