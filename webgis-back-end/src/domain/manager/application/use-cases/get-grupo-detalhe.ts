import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import {
  GrupoRepository,
  GrupoOverviewRow,
} from '../repositories/grupo-repository';
import {
  GrupoMembrosRepository,
  GrupoMembroComUsuario,
} from '../repositories/grupo-membros-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';

interface GetGrupoDetalheUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USER_ID: string;
  DSC_PERFIL: string | null;
}

type GetGrupoDetalheUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    row: GrupoOverviewRow;
    membership: 'dono' | 'membro' | 'pendente' | null;
    podeGerenciar: boolean;
    membros: GrupoMembroComUsuario[];
    pendentes: GrupoMembroComUsuario[];
    qtdItensVisiveis: number;
  }
>;

@Injectable()
export class GetGrupoDetalheUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_GRUPO_ID,
    COD_USER_ID,
    DSC_PERFIL,
  }: GetGrupoDetalheUseCaseRequest): Promise<GetGrupoDetalheUseCaseResponse> {
    const rows = await this.grupoRepository.findManyOverview(COD_USER_ID);
    const row = rows.find((r) => r.grupo.id.toString() === COD_GRUPO_ID);
    if (!row) return left(new ResourceNotFoundError());

    const ctx = await this.grupoAccessPolicy.buildContext(
      COD_USER_ID,
      DSC_PERFIL,
    );
    if (!this.grupoAccessPolicy.canViewGrupo(ctx, row.grupo)) {
      return left(new NotAllowedError());
    }

    const podeGerenciar = this.grupoAccessPolicy.canManageGrupo(ctx, row.grupo);
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
    const vinculos =
      await this.grupoMembrosRepository.findManyByGrupo(COD_GRUPO_ID);

    const membros = vinculos.filter((v) => v.membro.status === 'membro');
    const pendentes = podeGerenciar
      ? vinculos.filter((v) => v.membro.status === 'pendente')
      : [];

    const proprio = vinculos.find((v) => v.membro.userId === COD_USER_ID);
    const membership =
      row.grupo.grupoDono === COD_USER_ID
        ? ('dono' as const)
        : ((proprio?.membro.status ?? null) as 'membro' | 'pendente' | null);

    return right({
      row,
      membership,
      podeGerenciar,
      membros,
      pendentes,
      qtdItensVisiveis,
    });
  }
}
