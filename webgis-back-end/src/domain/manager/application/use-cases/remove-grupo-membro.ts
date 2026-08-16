import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';

interface RemoveGrupoMembroUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USER_ID_ALVO: string;
  COD_USER_SOLICITANTE: string;
  DSC_PERFIL_SOLICITANTE: string | null;
  DSC_PERFIL_ALVO: string | null;
}

type RemoveGrupoMembroUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>;

@Injectable()
export class RemoveGrupoMembroUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
    private policy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_GRUPO_ID,
    COD_USER_ID_ALVO,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
    DSC_PERFIL_ALVO,
  }: RemoveGrupoMembroUseCaseRequest): Promise<RemoveGrupoMembroUseCaseResponse> {
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

    // Admin já é participante automático de todo grupo; não pode ser removido.
    if (DSC_PERFIL_ALVO === 'Admin') {
      return left(new NotAllowedError());
    }

    const membro = await this.grupoMembrosRepository.findByGrupoAndUser(
      COD_GRUPO_ID,
      COD_USER_ID_ALVO,
    );

    if (!membro || !membro.ativo) {
      return left(new ResourceNotFoundError());
    }

    membro.excluir(COD_USER_SOLICITANTE);
    await this.grupoMembrosRepository.save(membro);

    return right(null);
  }
}
