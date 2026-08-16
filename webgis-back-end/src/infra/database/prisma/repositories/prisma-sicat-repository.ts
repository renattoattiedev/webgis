import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaSicatCidadeMapper } from '../mappers/prisma-sicat-cidades-mapper';
import { SicatCidade } from '@/domain/sicat/enterprise/entities/sicat-cidades';
import { SicatRepository } from '@/domain/sicat/application/repositories/sicat-repository';
import { SicatLogradouro } from '@/domain/sicat/enterprise/entities/sicat-logradouro';
import { SicatBairro } from '@/domain/sicat/enterprise/entities/sicat-bairro';
import { PrismaSicatBairroMapper } from '../mappers/prisma-sicat-bairros-mapper';
import { PrismaSicatLogradouroMapper } from '../mappers/prisma-sicat-logradouro-mapper';
import { SicatCliente } from '@/domain/sicat/enterprise/entities/sicat-cliente';
import { PrismaSicatClienteMapper } from '../mappers/prisma-sicat-cliente-mapper';
import { SicatImovel } from '@/domain/sicat/enterprise/entities/sicat-imovel';
import { PrismaSicatImovelMapper } from '../mappers/prisma-sicat-imovel-mapper';
import { SicatHidrometroImovel } from '@/domain/sicat/enterprise/entities/sicat-hidrometro-imovel';
import { PrismaSicatHidrometroImovelMapper } from '../mappers/prisma-sicat-hidrometro-imovel-mapper';
import { SicatImovelHidrometroDetalhado } from '@/domain/sicat/enterprise/entities/sicat-imovel-hidrometro-detalhado';
import { SicatImovelMatriculaDetalhada } from '@/domain/sicat/enterprise/entities/sicat-imovel-matricula-detalhada';

@Injectable()
export class PrismaSicatRepository implements SicatRepository {
  constructor(private prisma: PrismaService) {}

  async findManyCidades(): Promise<SicatCidade[]> {
    const cidades = await this.prisma.sicatCidade.findMany({
      orderBy: {
        dc_cidade: 'asc',
      },
    });

    return cidades.map(PrismaSicatCidadeMapper.toDomain);
  }

  async findManyLogradouros(cd_cidades: number[]): Promise<SicatLogradouro[]> {
    const logradouros = await this.prisma.sicatLogradouro.findMany({
      where: {
        cd_cidade: { in: cd_cidades },
      },
      orderBy: {
        dc_logradouro: 'asc',
      },
    });

    return logradouros.map(PrismaSicatLogradouroMapper.toDomain);
  }

  async findManyBairros(cd_cidades: number[]): Promise<SicatBairro[]> {
    const bairros = await this.prisma.sicatBairro.findMany({
      where: {
        cd_cidade: { in: cd_cidades },
      },
      orderBy: {
        dc_bairro: 'asc',
      },
    });

    return bairros.map(PrismaSicatBairroMapper.toDomain);
  }

  async findManyClientes(): Promise<SicatCliente[]> {
    const clientes = await this.prisma.sicatCliente.findMany({
      orderBy: {
        nome_cliente_interno: 'asc',
      },
    });

    return clientes.map(PrismaSicatClienteMapper.toDomain);
  }

  async findManyImoveis(): Promise<SicatImovel[]> {
    const imoveis = await this.prisma.sicatImovel.findMany({
      orderBy: {
        matricula_imovel: 'asc',
      },
    });

    return imoveis.map(PrismaSicatImovelMapper.toDomain);
  }

  async findClienteById(cd_cliente: number): Promise<SicatCliente | null> {
    const cliente = await this.prisma.sicatCliente.findFirst({
      where: {
        cd_cliente,
      },
    });

    if (!cliente) {
      return null;
    }

    return PrismaSicatClienteMapper.toDomain(cliente);
  }
  //aqui
  async findImovelByMatricula(
    matricula_imovel: number,
  ): Promise<SicatImovelMatriculaDetalhada | null> {
    const result = await this.prisma.$queryRaw<SicatImovelMatriculaDetalhada[]>`
            SELECT 
                si.matricula_imovel, 
                shi.codigo_hidrometro,
                sc2.nome_cliente_interno, 
                sl.sigla_logradouro, 
                sl.dc_logradouro, 
                si.numero_endereco, 
                sb.dc_bairro, 
                sc.dc_cidade
            FROM webgis_sicat_imovel si
            LEFT JOIN webgis_sicat_cliente sc2 
                ON si.cd_cliente = sc2.cd_cliente 
            LEFT JOIN webgis_sicat_logradouro sl 
                ON si.cd_cidade = sl.cd_cidade
                AND si.cd_logradouro = sl.cd_logradouro
            LEFT JOIN webgis_sicat_bairro sb 
                ON si.cd_bairro = sb.cd_bairro
                AND si.cd_cidade = sb.cd_cidade
            LEFT JOIN webgis_sicat_cidade sc 
                ON si.cd_cidade = sc.cd_cidade
            LEFT JOIN webgis_sicat_hidrometro_imovel shi 
                ON si.matricula_imovel = shi.matricula_imovel
            WHERE si.matricula_imovel = ${matricula_imovel}
        `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      matricula_imovel:
        typeof row.matricula_imovel === 'bigint'
          ? Number(row.matricula_imovel)
          : row.matricula_imovel,
      codigo_hidrometro: row.codigo_hidrometro,
      nome_cliente_interno: row.nome_cliente_interno,
      sigla_logradouro: row.sigla_logradouro,
      dc_logradouro: row.dc_logradouro,
      numero_endereco: row.numero_endereco,
      dc_bairro: row.dc_bairro,
      dc_cidade: row.dc_cidade,
    };
  }

  async findHidrometrosByMatricula(
    matricula_imovel: number,
  ): Promise<SicatHidrometroImovel[]> {
    const hidrometros = await this.prisma.sicatHidrometroImovel.findMany({
      where: {
        matricula_imovel,
      },
    });

    return hidrometros.map(PrismaSicatHidrometroImovelMapper.toDomain);
  }

  async findManyHidrometrosImoveis(): Promise<SicatHidrometroImovel[]> {
    const hidrometros = await this.prisma.sicatHidrometroImovel.findMany({
      orderBy: {
        matricula_imovel: 'asc',
      },
    });

    return hidrometros.map(PrismaSicatHidrometroImovelMapper.toDomain);
  }

  async findImovelDetalhadoByCodigoHidrometro(
    codigo_hidrometro: string,
  ): Promise<SicatImovelHidrometroDetalhado | null> {
    const result = await this.prisma.$queryRaw<
      SicatImovelHidrometroDetalhado[]
    >`
            SELECT 
                si.matricula_imovel, 
                shi.codigo_hidrometro,
                sc2.nome_cliente_interno, 
                sl.sigla_logradouro, 
                sl.dc_logradouro, 
                si.numero_endereco, 
                sb.dc_bairro, 
                sc.dc_cidade
            FROM webgis_sicat_imovel si
            LEFT JOIN webgis_sicat_cliente sc2 
                ON si.cd_cliente = sc2.cd_cliente 
            LEFT JOIN webgis_sicat_logradouro sl 
                ON si.cd_cidade = sl.cd_cidade
                AND si.cd_logradouro = sl.cd_logradouro
            LEFT JOIN webgis_sicat_bairro sb 
                ON si.cd_bairro = sb.cd_bairro
                AND si.cd_cidade = sb.cd_cidade
            LEFT JOIN webgis_sicat_cidade sc 
                ON si.cd_cidade = sc.cd_cidade
            LEFT JOIN webgis_sicat_hidrometro_imovel shi 
                ON si.matricula_imovel = shi.matricula_imovel
            WHERE shi.codigo_hidrometro = ${codigo_hidrometro}
        `;

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return {
      matricula_imovel:
        typeof row.matricula_imovel === 'bigint'
          ? Number(row.matricula_imovel)
          : row.matricula_imovel,
      codigo_hidrometro: row.codigo_hidrometro,
      nome_cliente_interno: row.nome_cliente_interno,
      sigla_logradouro: row.sigla_logradouro,
      dc_logradouro: row.dc_logradouro,
      numero_endereco: row.numero_endereco,
      dc_bairro: row.dc_bairro,
      dc_cidade: row.dc_cidade,
    };
  }
}
