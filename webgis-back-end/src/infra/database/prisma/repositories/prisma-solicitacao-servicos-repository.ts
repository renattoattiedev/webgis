import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SolicitacaoServicosRepository } from '@/domain/sicat/application/repositories/solicitacao-servicos-repository';
import { SolicitacaoServicos } from '@/domain/sicat/enterprise/entities/solicitacao-servicos';
import { PrismaSolicitacaoServicosMapper } from '../mappers/prisma-solicitacao-servicos-mapper';

@Injectable()
export class PrismaSolicitacaoServicosRepository
  implements SolicitacaoServicosRepository
{
  constructor(private prisma: PrismaService) {}

  async findMany(): Promise<SolicitacaoServicos[]> {
    const solicitacoes = await this.prisma.solicitacaoServicos.findMany({
      orderBy: {
        num_ss: 'desc',
      },
      take: 1000,
    });

    return solicitacoes.map(PrismaSolicitacaoServicosMapper.toDomain);
  }

  async findById(
    numSs: string,
    seqSs: number,
  ): Promise<SolicitacaoServicos | null> {
    const solicitacao = await this.prisma.solicitacaoServicos.findUnique({
      where: {
        num_ss_seq_ss: {
          num_ss: numSs,
          seq_ss: BigInt(seqSs),
        },
      },
    });

    if (!solicitacao) {
      return null;
    }

    return PrismaSolicitacaoServicosMapper.toDomain(solicitacao);
  }

  async findByMatriculaImovel(
    matricula: string,
  ): Promise<SolicitacaoServicos[]> {
    const solicitacoes = await this.prisma.solicitacaoServicos.findMany({
      where: {
        matricula,
      },
      orderBy: {
        num_ss: 'desc',
      },
    });

    return solicitacoes.map(PrismaSolicitacaoServicosMapper.toDomain);
  }

  async findByAtendimento(
    cd_atendimento: number,
  ): Promise<SolicitacaoServicos[]> {
    const solicitacoes = await this.prisma.solicitacaoServicos.findMany({
      where: {
        cd_atendimento,
      },
      orderBy: {
        num_ss: 'desc',
      },
    });

    return solicitacoes.map(PrismaSolicitacaoServicosMapper.toDomain);
  }

  async findDetalhadaByRefAtendimento(
    numSs: string,
    seqSs: number,
  ): Promise<any[]> {
    const result = await this.prisma.$queryRaw<any[]>`
      SELECT num_ss, servico, operacional, unidade, cliente, cpf_cnpj, matricula, dv, hidrometro, logradouro, num_imovel, telefone, bairro, referencia, obs, cd_atendimento, ref_atendimento, seq_ss
      FROM public.webgis_integracao_solicitacao_servico
      WHERE num_ss = ${numSs} AND seq_ss = ${seqSs}
      ORDER BY cd_atendimento DESC
    `;

    return result;
  }

  async findSeqSsByNumSs(numSs: string): Promise<number[]> {
    const result = await this.prisma.solicitacaoServicos.findMany({
      where: {
        num_ss: numSs,
      },
      select: {
        seq_ss: true,
      },
    });

    return result.map((item) => Number(item.seq_ss));
  }
}
