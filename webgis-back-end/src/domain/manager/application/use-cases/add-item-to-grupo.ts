import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { CamadasRepository } from '@/domain/camadas/application/repositories/camadas-repository';
import { CamadasRasterRepository } from '@/domain/camadas-raster/application/repositories/camadas-raster-repository';
import { MapasRepository } from '@/domain/mapas/application/repositories/mapas-repository';
import { GrupoAccessPolicy } from '../services/grupo-access-policy';
import {
  GrupoItensAdicionaisRepository,
  TipoItemGrupo,
} from '../repositories/grupo-itens-adicionais-repository';
import { buscarItemGrupo } from './buscar-item-grupo';

interface AddItemToGrupoUseCaseRequest {
  grupoId: string;
  tipo: TipoItemGrupo;
  itemId: string;
  requesterId: string;
  perfilRequester: string | null;
}

type AddItemToGrupoUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>;

@Injectable()
export class AddItemToGrupoUseCase {
  constructor(
    private camadasRepository: CamadasRepository,
    private camadasRasterRepository: CamadasRasterRepository,
    private mapasRepository: MapasRepository,
    private policy: GrupoAccessPolicy,
    private grupoItensAdicionaisRepository: GrupoItensAdicionaisRepository,
  ) {}

  async execute({
    grupoId,
    tipo,
    itemId,
    requesterId,
    perfilRequester,
  }: AddItemToGrupoUseCaseRequest): Promise<AddItemToGrupoUseCaseResponse> {
    const ctx = await this.policy.buildContext(requesterId, perfilRequester);

    if (!this.policy.canAssignToGrupo(ctx, grupoId)) {
      return left(new NotAllowedError());
    }

    const item = await buscarItemGrupo(tipo, itemId, {
      camadasRepository: this.camadasRepository,
      camadasRasterRepository: this.camadasRasterRepository,
      mapasRepository: this.mapasRepository,
    });

    if (!item) {
      return left(new ResourceNotFoundError());
    }

    if (item.grupoPrimarioId === grupoId) {
      return left(new NotAllowedError());
    }

    if (
      !this.policy.canEditGroupContentByGrupoId(
        ctx,
        item.grupoPrimarioId,
        item.criadorId,
      )
    ) {
      return left(new NotAllowedError());
    }

    const jaVinculado = await this.grupoItensAdicionaisRepository.existsVinculo(
      tipo,
      itemId,
      grupoId,
    );
    if (jaVinculado) {
      return left(new NotAllowedError());
    }

    await this.grupoItensAdicionaisRepository.create(tipo, itemId, grupoId);
    return right(null);
  }
}
