import { SolicitacaoServicos } from '../../enterprise/entities/solicitacao-servicos';

export abstract class SolicitacaoServicosRepository {
  abstract findMany(): Promise<SolicitacaoServicos[]>;
  abstract findById(
    numSs: string,
    seqSs: number,
  ): Promise<SolicitacaoServicos | null>;
  abstract findByMatriculaImovel(
    matricula: string,
  ): Promise<SolicitacaoServicos[]>;
  abstract findByAtendimento(
    cd_atendimento: number,
  ): Promise<SolicitacaoServicos[]>;
  abstract findDetalhadaByRefAtendimento(
    numSs: string,
    seqSs: number,
  ): Promise<any[]>;
  abstract findSeqSsByNumSs(numSs: string): Promise<number[]>;
}
