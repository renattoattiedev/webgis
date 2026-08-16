import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  GrupoItensAdicionaisRepository,
  TipoItemGrupo,
} from '@/domain/manager/application/repositories/grupo-itens-adicionais-repository';

@Injectable()
export class PrismaGrupoItensAdicionaisRepository
  implements GrupoItensAdicionaisRepository
{
  constructor(private prisma: PrismaService) {}

  /** Delegate Prisma varia por tipo (3 tabelas físicas distintas); `any` evita fricção de tipos entre delegates com shapes diferentes. */
  private modelo(tipo: TipoItemGrupo): any {
    switch (tipo) {
      case 'camada':
        return this.prisma.camadaGrupoAdicional;
      case 'raster':
        return this.prisma.camadaRasterGrupoAdicional;
      case 'mapa':
        return this.prisma.mapaGrupoAdicional;
    }
  }

  private campoItem(tipo: TipoItemGrupo): string {
    switch (tipo) {
      case 'camada':
        return 'COD_CAMADA_ID';
      case 'raster':
        return 'COD_CAMADA_RASTER_ID';
      case 'mapa':
        return 'COD_MAPA_ID';
    }
  }

  async existsVinculo(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<boolean> {
    const registro = await this.modelo(tipo).findFirst({
      where: { [this.campoItem(tipo)]: itemId, COD_GRUPO_ID: grupoId } as any,
    });
    return !!registro;
  }

  async create(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<void> {
    await this.modelo(tipo).create({
      data: { [this.campoItem(tipo)]: itemId, COD_GRUPO_ID: grupoId } as any,
    });
  }

  async delete(
    tipo: TipoItemGrupo,
    itemId: string,
    grupoId: string,
  ): Promise<void> {
    await this.modelo(tipo).deleteMany({
      where: { [this.campoItem(tipo)]: itemId, COD_GRUPO_ID: grupoId } as any,
    });
  }

  async findGrupoIdsByItem(
    tipo: TipoItemGrupo,
    itemId: string,
  ): Promise<string[]> {
    const registros = await this.modelo(tipo).findMany({
      where: { [this.campoItem(tipo)]: itemId } as any,
    });
    return registros.map((r: any) => r.COD_GRUPO_ID);
  }

  async findItemIdsByGrupo(
    tipo: TipoItemGrupo,
    grupoId: string,
  ): Promise<string[]> {
    const registros = await this.modelo(tipo).findMany({
      where: { COD_GRUPO_ID: grupoId },
    });
    const campo = this.campoItem(tipo);
    return registros.map((r: any) => r[campo]);
  }
}
