import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { GrupoRepository } from '../repositories/grupo-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';

interface MoverItensGrupoUseCaseRequest {
  COD_GRUPO_ORIGEM_ID: string;
  COD_GRUPO_DESTINO_ID: string;
  COD_USER_SOLICITANTE: string;
  DSC_PERFIL_SOLICITANTE: string | null;
}

type MoverItensGrupoUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { qtdItensMovidos: number }
>;

@Injectable()
export class MoverItensGrupoUseCase {
  constructor(
    private grupoRepository: GrupoRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_GRUPO_ORIGEM_ID,
    COD_GRUPO_DESTINO_ID,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: MoverItensGrupoUseCaseRequest): Promise<MoverItensGrupoUseCaseResponse> {
    const grupoOrigem =
      await this.grupoRepository.findById(COD_GRUPO_ORIGEM_ID);
    if (!grupoOrigem) return left(new ResourceNotFoundError());

    // findById filtra DHS_EXCLUSAO: null, então um grupo destino soft-deletado
    // já retorna null aqui e cai neste mesmo ResourceNotFoundError.
    const grupoDestino =
      await this.grupoRepository.findById(COD_GRUPO_DESTINO_ID);
    if (!grupoDestino) return left(new ResourceNotFoundError());

    const ctx = await this.grupoAccessPolicy.buildContext(
      COD_USER_SOLICITANTE,
      DSC_PERFIL_SOLICITANTE,
    );

    if (!this.grupoAccessPolicy.canManageGrupo(ctx, grupoOrigem)) {
      return left(new NotAllowedError());
    }
    if (!this.grupoAccessPolicy.canAssignToGrupo(ctx, COD_GRUPO_DESTINO_ID)) {
      return left(new NotAllowedError());
    }

    const qtdItensMovidos = await this.grupoRepository.moveItensDoGrupo(
      COD_GRUPO_ORIGEM_ID,
      COD_GRUPO_DESTINO_ID,
    );

    return right({ qtdItensMovidos });
  }
}
