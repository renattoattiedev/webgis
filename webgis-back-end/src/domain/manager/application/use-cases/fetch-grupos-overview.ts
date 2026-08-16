import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import {
  GrupoRepository,
  GrupoOverviewRow,
} from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';

export type GrupoOverviewItem = GrupoOverviewRow & {
  membership: 'dono' | 'membro' | 'pendente' | null;
  podeGerenciar: boolean;
  qtdItensVisiveis: number;
};

interface FetchGruposOverviewUseCaseRequest {
  COD_USER_ID: string;
  DSC_PERFIL: string | null;
}

type FetchGruposOverviewUseCaseResponse = Either<
  null,
  { grupos: GrupoOverviewItem[] }
>;

@Injectable()
export class FetchGruposOverviewUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_USER_ID,
    DSC_PERFIL,
  }: FetchGruposOverviewUseCaseRequest): Promise<FetchGruposOverviewUseCaseResponse> {
    const ctx = await this.grupoAccessPolicy.buildContext(
      COD_USER_ID,
      DSC_PERFIL,
    );
    const rows = await this.grupoRepository.findManyOverview(COD_USER_ID);
    const vinculos =
      await this.grupoMembrosRepository.findManyByUser(COD_USER_ID);
    const statusPorGrupo = new Map(
      vinculos.map((v) => [v.grupoId, v.status] as const),
    );

    const grupos = rows
      .filter((row) => this.grupoAccessPolicy.canViewGrupo(ctx, row.grupo))
      .map((row) => {
        const grupoId = row.grupo.id.toString();
        const membership =
          row.grupo.grupoDono === COD_USER_ID
            ? ('dono' as const)
            : ((statusPorGrupo.get(grupoId) ?? null) as
                | 'membro'
                | 'pendente'
                | null);
        const qtdItensVisiveis = this.grupoAccessPolicy.contarItensVisiveis(
          ctx,
          row.grupo,
          {
            publico: row.qtdItensPublico,
            institucional: row.qtdItensInstitucional,
            privadoTotal: row.qtdItensPrivadoTotal,
            privadoCriador: row.qtdItensPrivadoCriador,
          },
        );
        return {
          ...row,
          membership,
          podeGerenciar: this.grupoAccessPolicy.canManageGrupo(ctx, row.grupo),
          qtdItensVisiveis,
        };
      });

    return right({ grupos });
  }
}
