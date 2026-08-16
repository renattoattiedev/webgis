import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { GrupoMembro } from '../../enterprise/entities/grupo-membro';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';

interface AddGrupoMembroUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USER_ID_ALVO: string;
  COD_USER_SOLICITANTE: string;
  DSC_PERFIL_SOLICITANTE: string | null;
}

type AddGrupoMembroUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { membro: GrupoMembro }
>;

@Injectable()
export class AddGrupoMembroUseCase {
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
  }: AddGrupoMembroUseCaseRequest): Promise<AddGrupoMembroUseCaseResponse> {
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

    if (COD_USER_ID_ALVO === grupo.grupoDono) {
      return left(new NotAllowedError());
    }

    const existente = await this.grupoMembrosRepository.findByGrupoAndUser(
      COD_GRUPO_ID,
      COD_USER_ID_ALVO,
    );

    if (existente) {
      existente.reativar('membro', COD_USER_SOLICITANTE);
      await this.grupoMembrosRepository.save(existente);
      return right({ membro: existente });
    }

    const membro = GrupoMembro.create(
      {
        COD_GRUPO_ID,
        COD_USER_ID: COD_USER_ID_ALVO,
        DSC_STATUS: 'membro',
        USUARIO_CRIACAO: COD_USER_SOLICITANTE,
        DHS_INCLUSAO: new Date(),
      },
      new UniqueEntityID(),
    );

    await this.grupoMembrosRepository.create(membro);

    return right({ membro });
  }
}
