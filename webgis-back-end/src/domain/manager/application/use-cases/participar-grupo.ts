import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { GrupoMembro } from '../../enterprise/entities/grupo-membro';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';

interface ParticiparGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USER_ID: string;
}

type ParticiparGrupoUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { membro: GrupoMembro }
>;

@Injectable()
export class ParticiparGrupoUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
  ) {}

  async execute({
    COD_GRUPO_ID,
    COD_USER_ID,
  }: ParticiparGrupoUseCaseRequest): Promise<ParticiparGrupoUseCaseResponse> {
    const grupo = await this.grupoRepository.findById(COD_GRUPO_ID);

    if (!grupo) {
      return left(new ResourceNotFoundError());
    }

    if (grupo.grupoPoliticaParticipacao !== 'aberto') {
      return left(new NotAllowedError());
    }

    if (COD_USER_ID === grupo.grupoDono) {
      return left(new NotAllowedError());
    }

    const existente = await this.grupoMembrosRepository.findByGrupoAndUser(
      COD_GRUPO_ID,
      COD_USER_ID,
    );

    if (existente && existente.ativo) {
      return right({ membro: existente });
    }

    if (existente) {
      existente.reativar('membro', COD_USER_ID);
      await this.grupoMembrosRepository.save(existente);
      return right({ membro: existente });
    }

    const membro = GrupoMembro.create(
      {
        COD_GRUPO_ID,
        COD_USER_ID,
        DSC_STATUS: 'membro',
        USUARIO_CRIACAO: COD_USER_ID,
        DHS_INCLUSAO: new Date(),
      },
      new UniqueEntityID(),
    );

    await this.grupoMembrosRepository.create(membro);

    return right({ membro });
  }
}
