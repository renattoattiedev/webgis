import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaCamadasMapper } from '../mappers/prisma-camadas-mapper';
import { PrismaAtributosMapper } from '../mappers/prisma-atributos-mapper';
import { PacotesConceituais } from '@/domain/manager/enterprise/entities/pacotes-conceituais';

@Injectable()
export class PrismaCamadasRepository implements CamadasRepository {
  constructor(private prisma: PrismaService) {}

  async findByNome(NOM_NOME: string): Promise<Camadas | null> {
    const camada = await this.prisma.camadas.findFirst({
      where: {
        NOM_NOME,
        DHS_EXCLUSAO: null,
      },
    });

    if (!camada) {
      return null;
    }

    //LOG de Acesso
    await this.prisma.camadasLog.create({
      data: {
        COD_CAMADA_ID: camada.COD_CAMADA_ID,
      },
    });

    return PrismaCamadasMapper.toDomain(camada);
  }

  async findPacoteConceitual(NOM_NOME: string): Promise<string | null> {
    const camada = await this.prisma.camadas.findFirst({
      where: {
        NOM_NOME,
        DHS_EXCLUSAO: null,
      },
      include: {
        pacotes_conceituais: true,
      },
    });

    if (!camada || !camada.pacotes_conceituais) {
      return null;
    }

    return camada.pacotes_conceituais.NOM_NOME_PACOTE_CONCEITUAL;
  }

  async findById(COD_CAMADA_ID: string): Promise<Camadas | null> {
    const camada = await this.prisma.camadas.findUnique({
      where: {
        COD_CAMADA_ID,
        DHS_EXCLUSAO: null,
      },
    });

    if (!camada) {
      return null;
    }

    //LOG de Acesso
    await this.prisma.camadasLog.create({
      data: {
        COD_CAMADA_ID: camada.COD_CAMADA_ID,
      },
    });

    return PrismaCamadasMapper.toDomain(camada);
  }

  async findManyByCamadasId(NOM_NOME): Promise<Camadas[]> {
    const camada = await this.prisma.camadas.findMany({
      where: {
        NOM_NOME,
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camada.map(PrismaCamadasMapper.toDomain);
  }

  async findManyByCamadasUserId(COD_USUARIO_CRIACAO): Promise<Camadas[]> {
    const camada = await this.prisma.camadas.findMany({
      where: {
        COD_USUARIO_CRIACAO,
        DHS_EXCLUSAO: null,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camada.map(PrismaCamadasMapper.toDomain);
  }

  async findManyByCamadasGrupoId(COD_GRUPO_ID: string): Promise<Camadas[]> {
    const camadasComAtributos = await this.prisma.camadas.findMany({
      where: {
        OR: [
          { COD_GRUPO_ID },
          { grupos_adicionais: { some: { COD_GRUPO_ID } } },
        ],
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      include: {
        atributos: true,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camadasComAtributos.map((camada) => {
      const domainCamada = PrismaCamadasMapper.toDomain(camada);

      const domainAtributos = camada.atributos
        .filter((attr) => attr.NOM_NOME_ATRIBUTO !== 'id')
        .map((attr) => PrismaAtributosMapper.toDomain(attr));

      domainCamada.setCamadaAtributos(domainAtributos);
      return domainCamada;
    });
  }

  async findManyAtivas(): Promise<Camadas[]> {
    const camadasComAtributos = await this.prisma.camadas.findMany({
      where: {
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      include: {
        atributos: true,
      },
      orderBy: {
        DHS_INCLUSAO: 'desc',
      },
    });

    return camadasComAtributos.map((camada) => {
      const domainCamada = PrismaCamadasMapper.toDomain(camada);

      const domainAtributos = camada.atributos
        .filter((attr) => attr.NOM_NOME_ATRIBUTO !== 'id')
        .map((attr) => PrismaAtributosMapper.toDomain(attr));

      domainCamada.setCamadaAtributos(domainAtributos);
      return domainCamada;
    });
  }

  async findManyByPacoteConceitual(
    COD_PACOTE_CONCEITUAL_ID: string,
  ): Promise<Camadas[]> {
    const camadas = await this.prisma.camadas.findMany({
      where: {
        COD_PACOTE_CONCEITUAL_ID,
        DHS_EXCLUSAO: null,
      },
    });

    return camadas.map(PrismaCamadasMapper.toDomain);
  }

  async create(camada: Camadas): Promise<void> {
    const data = PrismaCamadasMapper.toPrisma(camada);

    await this.prisma.camadas.create({
      data,
    });
  }

  async save(camada: Camadas): Promise<void> {
    const data = PrismaCamadasMapper.toPrisma(camada);

    await Promise.all([
      this.prisma.camadas.update({
        where: {
          COD_CAMADA_ID: camada.id.toString(),
        },
        data,
      }),
    ]);
  }

  async changeOwner(
    COD_CAMADA_ID: string,
    COD_USUARIO_CRIACAO: string,
    COD_NEW_OWNER: string,
  ): Promise<void> {
    await this.prisma.camadas.update({
      where: {
        COD_CAMADA_ID,
        COD_USUARIO_CRIACAO,
        FLG_CAMADA_ATIVA: true,
        DHS_EXCLUSAO: null,
      },
      data: {
        COD_USUARIO_CRIACAO: COD_NEW_OWNER,
        DHS_ULTIMA_ALTERACAO: new Date(),
      },
    });
  }
  async deleteCamada(
    COD_CAMADA_ID: string,
    COD_USUARIO_EXCLUSAO: string,
  ): Promise<void> {
    await this.prisma.camadas.update({
      where: {
        COD_CAMADA_ID,
        DHS_EXCLUSAO: null,
      },
      data: {
        DHS_EXCLUSAO: new Date(),
        COD_USUARIO_EXCLUSAO,
      },
    });
    await this.prisma.foldersCamadas.deleteMany({
      where: {
        COD_CAMADA_ID,
      },
    });

    await this.prisma.mapasCamadas.deleteMany({
      where: {
        COD_CAMADA_ID,
      },
    });
  }

  async recoveryCamada(COD_CAMADA_ID: string): Promise<void> {
    await this.prisma.camadas.update({
      where: {
        COD_CAMADA_ID,
        DHS_EXCLUSAO: {
          not: null,
        },
      },
      data: {
        DHS_EXCLUSAO: null,
      },
    });
  }
  async deactivateCamada(COD_CAMADA_ID: string): Promise<void> {
    await this.prisma.camadas.update({
      where: {
        COD_CAMADA_ID,
        FLG_CAMADA_ATIVA: true,
      },
      data: {
        FLG_CAMADA_ATIVA: false,
      },
    });
  }

  async activateCamada(COD_CAMADA_ID: string): Promise<void> {
    await this.prisma.camadas.update({
      where: {
        COD_CAMADA_ID,
        FLG_CAMADA_ATIVA: false,
      },
      data: {
        FLG_CAMADA_ATIVA: true,
      },
    });
  }

  async findComponentsAssociatedWithCamada(
    COD_CAMADA_ID: string,
  ): Promise<
    Array<{ COD_COMPONENTE_ID: string; NOM_NOME_COMPONENTE: string }>
  > {
    const componentes = await this.prisma.$queryRaw<
      Array<{ COD_COMPONENTE_ID: string; NOM_NOME_COMPONENTE: string }>
    >`
      SELECT
        "COD_COMPONENTE_ID",
        "NOM_NOME_COMPONENTE"
      FROM "TP_COMPONENTE"
      WHERE (
        "JSON_CONFIGURACAO"->'camada_alvo'->>'camada' = ${COD_CAMADA_ID}
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE("JSON_CONFIGURACAO"->'camadas', '[]'::jsonb)) AS camada_item
          WHERE camada_item->>'camada' = ${COD_CAMADA_ID}
        )
      )
    `;
    return componentes;
  }
}
