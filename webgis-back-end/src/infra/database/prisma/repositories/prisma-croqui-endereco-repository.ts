import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CroquiRepository } from '@/domain/croqui/application/repositories/croqui-endereco-repository';
import { CroquiEndereco } from '@/domain/croqui/enterprise/entities/croqui-endereco';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

@Injectable()
export class PrismaCroquiEnderecoRepository implements CroquiRepository {
  constructor(private prisma: PrismaService) {}

  async findCroquiEnderecoCompletoByFiltros(
    cd_cidade?: number,
    cd_bairro?: number,
    cd_logradouro?: number,
  ): Promise<CroquiEndereco[]> {
    const whereClause: any = {};

    if (cd_cidade) {
      whereClause.cd_cidade = cd_cidade;
    }

    if (cd_bairro) {
      whereClause.cd_bairro = cd_bairro;
    }

    if (cd_logradouro) {
      whereClause.cd_logradouro = cd_logradouro;
    }

    const enderecos = await this.prisma.sicatImovel.findMany({
      where: whereClause,
      include: {
        cliente: true,
        cidade: true,
        bairro: true,
        logradouro: true,
      },
      orderBy: {
        matricula_imovel: 'asc',
      },
      take: 500,
    });

    return enderecos.map((endereco) =>
      CroquiEndereco.create(
        {
          matricula_imovel: Number(endereco.matricula_imovel),
          dv: endereco.dv ? Number(endereco.dv) : null,
          nome_cliente_interno:
            endereco.cliente?.nome_cliente_interno?.trim() || null,
          sigla_logradouro:
            endereco.logradouro?.sigla_logradouro?.trim() || null,
          dc_logradouro: endereco.logradouro?.dc_logradouro?.trim() || null,
          numero_endereco: endereco.numero_endereco?.trim(),
          dc_bairro: endereco.bairro?.dc_bairro?.trim() || null,
          dc_cidade: endereco.cidade?.dc_cidade?.trim() || null,
        },
        new UniqueEntityID(endereco.matricula_imovel.toString()),
      ),
    );
  }

  async findCroquiEnderecoCompleto(): Promise<CroquiEndereco[]> {
    const enderecos = await this.prisma.sicatImovel.findMany({
      include: {
        cliente: true,
        cidade: true,
        bairro: true,
        logradouro: true,
      },
      orderBy: {
        matricula_imovel: 'asc',
      },
    });

    return enderecos.map((endereco) =>
      CroquiEndereco.create(
        {
          matricula_imovel: Number(endereco.matricula_imovel),
          dv: endereco.dv ? Number(endereco.dv) : null,
          nome_cliente_interno:
            endereco.cliente?.nome_cliente_interno?.trim() || null,
          sigla_logradouro:
            endereco.logradouro?.sigla_logradouro?.trim() || null,
          dc_logradouro: endereco.logradouro?.dc_logradouro?.trim() || null,
          numero_endereco: endereco.numero_endereco?.trim(),
          dc_bairro: endereco.bairro?.dc_bairro?.trim() || null,
          dc_cidade: endereco.cidade?.dc_cidade?.trim() || null,
        },
        new UniqueEntityID(endereco.matricula_imovel.toString()),
      ),
    );
  }

  async findCroquiEnderecoCompletoByMatricula(
    matricula: number,
  ): Promise<CroquiEndereco | null> {
    const endereco = await this.prisma.sicatImovel.findFirst({
      where: {
        matricula_imovel: matricula,
      },
      include: {
        cliente: true,
        cidade: true,
        bairro: true,
        logradouro: true,
      },
    });

    if (!endereco) {
      return null;
    }

    return CroquiEndereco.create(
      {
        matricula_imovel: Number(endereco.matricula_imovel),
        dv: endereco.dv ? Number(endereco.dv) : null,
        nome_cliente_interno:
          endereco.cliente?.nome_cliente_interno?.trim() || null,
        sigla_logradouro: endereco.logradouro?.sigla_logradouro?.trim() || null,
        dc_logradouro: endereco.logradouro?.dc_logradouro?.trim() || null,
        numero_endereco: endereco.numero_endereco?.trim(),
        dc_bairro: endereco.bairro?.dc_bairro?.trim() || null,
        dc_cidade: endereco.cidade?.dc_cidade?.trim() || null,
      },
      new UniqueEntityID(endereco.matricula_imovel.toString()),
    );
  }

  async findCroquiEnderecoCompletoByCliente(
    nomeCliente: string,
  ): Promise<CroquiEndereco | null> {
    const endereco = await this.prisma.sicatImovel.findFirst({
      where: {
        cliente: {
          nome_cliente_interno: {
            contains: nomeCliente,
            mode: 'insensitive',
          },
        },
      },
      include: {
        cliente: true,
        cidade: true,
        bairro: true,
        logradouro: true,
      },
      orderBy: {
        matricula_imovel: 'asc',
      },
    });

    if (!endereco) {
      return null;
    }

    return CroquiEndereco.create(
      {
        matricula_imovel: Number(endereco.matricula_imovel),
        dv: endereco.dv ? Number(endereco.dv) : null,
        nome_cliente_interno:
          endereco.cliente?.nome_cliente_interno?.trim() || null,
        sigla_logradouro: endereco.logradouro?.sigla_logradouro?.trim() || null,
        dc_logradouro: endereco.logradouro?.dc_logradouro?.trim() || null,
        numero_endereco: endereco.numero_endereco?.trim(),
        dc_bairro: endereco.bairro?.dc_bairro?.trim() || null,
        dc_cidade: endereco.cidade?.dc_cidade?.trim() || null,
      },
      new UniqueEntityID(endereco.matricula_imovel.toString()),
    );
  }

  async findCroquiEnderecoCompletoByCidade(
    cidade: string,
  ): Promise<CroquiEndereco[]> {
    const enderecos = await this.prisma.sicatImovel.findMany({
      where: {
        cidade: {
          dc_cidade: {
            contains: cidade,
            mode: 'insensitive',
          },
        },
      },
      include: {
        cliente: true,
        cidade: true,
        bairro: true,
        logradouro: true,
      },
      orderBy: {
        matricula_imovel: 'asc',
      },
    });

    return enderecos.map((endereco) =>
      CroquiEndereco.create(
        {
          matricula_imovel: Number(endereco.matricula_imovel),
          dv: endereco.dv ? Number(endereco.dv) : null,
          nome_cliente_interno:
            endereco.cliente?.nome_cliente_interno?.trim() || null,
          sigla_logradouro:
            endereco.logradouro?.sigla_logradouro?.trim() || null,
          dc_logradouro: endereco.logradouro?.dc_logradouro?.trim() || null,
          numero_endereco: endereco.numero_endereco?.trim(),
          dc_bairro: endereco.bairro?.dc_bairro?.trim() || null,
          dc_cidade: endereco.cidade?.dc_cidade?.trim() || null,
        },
        new UniqueEntityID(endereco.matricula_imovel.toString()),
      ),
    );
  }

  async findCroquiEnderecoCompletoByBairro(
    bairro: string,
  ): Promise<CroquiEndereco[]> {
    const enderecos = await this.prisma.sicatImovel.findMany({
      where: {
        bairro: {
          dc_bairro: {
            contains: bairro,
            mode: 'insensitive',
          },
        },
      },
      include: {
        cliente: true,
        cidade: true,
        bairro: true,
        logradouro: true,
      },
      orderBy: {
        matricula_imovel: 'asc',
      },
    });

    return enderecos.map((endereco) =>
      CroquiEndereco.create(
        {
          matricula_imovel: Number(endereco.matricula_imovel),
          dv: endereco.dv ? Number(endereco.dv) : null,
          nome_cliente_interno:
            endereco.cliente?.nome_cliente_interno?.trim() || null,
          sigla_logradouro:
            endereco.logradouro?.sigla_logradouro?.trim() || null,
          dc_logradouro: endereco.logradouro?.dc_logradouro?.trim() || null,
          numero_endereco: endereco.numero_endereco?.trim(),
          dc_bairro: endereco.bairro?.dc_bairro?.trim() || null,
          dc_cidade: endereco.cidade?.dc_cidade?.trim() || null,
        },
        new UniqueEntityID(endereco.matricula_imovel.toString()),
      ),
    );
  }

  async findCroquiEnderecoCompletoByLogradouro(
    logradouro: string,
  ): Promise<CroquiEndereco[]> {
    const enderecos = await this.prisma.sicatImovel.findMany({
      where: {
        logradouro: {
          dc_logradouro: {
            contains: logradouro,
            mode: 'insensitive',
          },
        },
      },
      include: {
        cliente: true,
        cidade: true,
        bairro: true,
        logradouro: true,
      },
      orderBy: {
        matricula_imovel: 'asc',
      },
    });

    return enderecos.map((endereco) =>
      CroquiEndereco.create(
        {
          matricula_imovel: Number(endereco.matricula_imovel),
          dv: endereco.dv ? Number(endereco.dv) : null,
          nome_cliente_interno:
            endereco.cliente?.nome_cliente_interno?.trim() || null,
          sigla_logradouro:
            endereco.logradouro?.sigla_logradouro?.trim() || null,
          dc_logradouro: endereco.logradouro?.dc_logradouro?.trim() || null,
          numero_endereco: endereco.numero_endereco?.trim(),
          dc_bairro: endereco.bairro?.dc_bairro?.trim() || null,
          dc_cidade: endereco.cidade?.dc_cidade?.trim() || null,
        },
        new UniqueEntityID(endereco.matricula_imovel.toString()),
      ),
    );
  }
}
