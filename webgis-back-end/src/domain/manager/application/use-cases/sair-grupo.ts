import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoMembrosRepository } from '../repositories/grupo-membros-repository';

interface SairGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
  COD_USER_ID: string;
}

type SairGrupoUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>;

@Injectable()
export class SairGrupoUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoMembrosRepository: GrupoMembrosRepository,
  ) {}

  async execute({
    COD_GRUPO_ID,
    COD_USER_ID,
  }: SairGrupoUseCaseRequest): Promise<SairGrupoUseCaseResponse> {
    const grupo = await this.grupoRepository.findById(COD_GRUPO_ID);

    if (!grupo) {
      return left(new ResourceNotFoundError());
    }

    if (grupo.grupoDono === COD_USER_ID) {
      return left(new NotAllowedError());
    }

    const membro = await this.grupoMembrosRepository.findByGrupoAndUser(
      COD_GRUPO_ID,
      COD_USER_ID,
    );

    if (!membro || !membro.ativo) {
      return left(new ResourceNotFoundError());
    }

    membro.excluir(COD_USER_ID);
    await this.grupoMembrosRepository.save(membro);

    return right(null);
  }
}
