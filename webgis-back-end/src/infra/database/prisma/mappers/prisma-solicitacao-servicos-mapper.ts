import { SolicitacaoServicos as PrismaSolicitacaoServicos } from '@prisma/client';
import { SolicitacaoServicos } from '@/domain/sicat/enterprise/entities/solicitacao-servicos';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';

export class PrismaSolicitacaoServicosMapper {
  static toDomain(raw: PrismaSolicitacaoServicos): SolicitacaoServicos {
    return SolicitacaoServicos.create(
      {
        numSs: raw.num_ss,
        servico: raw.servico,
        operacional: raw.operacional,
        unidade: raw.unidade,
        cliente: raw.cliente,
        cpfCnpj: raw.cpf_cnpj,
        matricula: raw.matricula,
        dv: raw.dv,
        hidrometro: raw.hidrometro,
        logradouro: raw.logradouro,
        numImovel: raw.num_imovel,
        telefone: raw.telefone,
        bairro: raw.bairro,
        referencia: raw.referencia,
        obs: raw.obs,
        cdAtendimento: raw.cd_atendimento,
        refAtendimento: raw.ref_atendimento,
        seqSs: raw.seq_ss,
      },
      new UniqueEntityID(raw.seq_ss?.toString() ?? ''),
    );
  }
}
