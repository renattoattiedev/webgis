import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';

interface ResponderSolicitacaoGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USER_ID_ALVO: string;
  APROVAR: boolean;
  COD_USER_SOLICITANTE: string;
  DSC_PERFIL_SOLICITANTE: string | null;
}

type ResponderSolicitacaoGrupoUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>;

@Injectable()
export class ResponderSolicitacaoGrupoUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
    private policy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_GRUPO_ID,
    COD_USER_ID_ALVO,
    APROVAR,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: ResponderSolicitacaoGrupoUseCaseRequest): Promise<ResponderSolicitacaoGrupoUseCaseResponse> {
    const grupo = await this.grupoRepository.findById(COD_GRUPO_ID);

    if (!grupo) {
      return left(new ResourceNotFoundError());
    }

    const ctx = await this.policy.buildContext(
      COD_USER_SOLICITANTE,
      DSC_PERFIL_SOLICITANTE,
    );

    if (!this.policy.canManageGrupo(ctx, grupo)) {
      return left(new NotAllowedError());
    }

    const membro = await this.grupoMembrosRepository.findByGrupoAndUser(
      COD_GRUPO_ID,
      COD_USER_ID_ALVO,
    );

    if (!membro || !membro.ativo || membro.status !== 'pendente') {
      return left(new ResourceNotFoundError());
    }

    if (APROVAR) {
      membro.aprovar(COD_USER_SOLICITANTE);
    } else {
      membro.excluir(COD_USER_SOLICITANTE);
    }

    await this.grupoMembrosRepository.save(membro);

    return right(null);
  }
}
