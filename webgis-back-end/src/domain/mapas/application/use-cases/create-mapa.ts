import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { MapaAlreadyExistsError } from '../../../mapas/application/use-cases/errors/mapa-already-exists-error';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface MapaUseCaseRequest {
  COD_MAPA_ID: UniqueEntityID;
  GRUPOS_MAPAS: string;
  NIVEL_COMPATILHAMENTO: string;
  NOM_NOME_MAPA: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_BOUNDING_BOX: string | null;
  USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

type MapaUseCaseResponse = Either<
  MapaAlreadyExistsError | NotAllowedError,
  {
    mapa: Mapas;
  }
>;

@Injectable()
export class CreateMapaUseCase {
  constructor(
    private mapasRepository: MapasRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    GRUPOS_MAPAS,
    NIVEL_COMPATILHAMENTO,
    NOM_NOME_MAPA,
    DSC_TITULO,
    DSC_DESCRICAO,
    DSC_BOUNDING_BOX,
    USUARIO_CRIACAO,
    DHS_INCLUSAO,
    BOL_CARREGAMENTO_DEFAULT,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: MapaUseCaseRequest): Promise<MapaUseCaseResponse> {
    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      if (!this.grupoAccessPolicy.canAssignToGrupo(ctx, GRUPOS_MAPAS)) {
        return left(new NotAllowedError());
      }
    }

    const result = await this.mapasRepository.findByNome(NOM_NOME_MAPA);

    const { mapa: mapaWithSameNome } = result;

    if (mapaWithSameNome) {
      return left(new MapaAlreadyExistsError(NOM_NOME_MAPA));
    }

    const mapa = Mapas.create({
      GRUPOS_MAPAS,
      NIVEL_COMPATILHAMENTO,
      NOM_NOME_MAPA,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_BOUNDING_BOX,
      USUARIO_CRIACAO,
      DHS_INCLUSAO,
      COD_USUARIO_ULTIMA_ALTERACAO: null,
      BOL_CARREGAMENTO_DEFAULT: !!BOL_CARREGAMENTO_DEFAULT,
    });

    await this.mapasRepository.create(mapa);

    return right({
      mapa,
    });
  }
}
