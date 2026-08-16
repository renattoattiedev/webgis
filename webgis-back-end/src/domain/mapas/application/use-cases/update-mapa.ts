import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { Mapas } from '../../../mapas/enterprise/entities/mapas';
import { MapasRepository } from '../../../mapas/application/repositories/mapas-repository';
import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface UpdateMapaRequest {
  COD_MAPA_ID: string;
  GRUPOS_MAPAS: string;
  NIVEL_COMPATILHAMENTO: string;
  NOM_NOME_MAPA: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_BOUNDING_BOX: string;
  COD_USUARIO_ULTIMA_ALTERACAO: string;
  BOL_CARREGAMENTO_DEFAULT: boolean;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

type UpdateMapaResponse = Either<
  Error | NotAllowedError,
  {
    mapa: Mapas;
    camadas: Camadas[];
  }
>;

@Injectable()
export class UpdateMapaUseCase {
  constructor(
    private mapasRepository: MapasRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_MAPA_ID,
    GRUPOS_MAPAS,
    NIVEL_COMPATILHAMENTO,
    NOM_NOME_MAPA,
    DSC_TITULO,
    DSC_DESCRICAO,
    DSC_BOUNDING_BOX,
    COD_USUARIO_ULTIMA_ALTERACAO,
    BOL_CARREGAMENTO_DEFAULT,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: UpdateMapaRequest): Promise<UpdateMapaResponse> {
    const result = await this.mapasRepository.findById(COD_MAPA_ID.toString());
    if (!result || !result.mapa) {
      throw new Error('Mapa not found');
    }

    const { mapa, camadas } = result;

    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      const permitido = this.grupoAccessPolicy.canEditGroupContentByGrupoId(
        ctx,
        mapa.mapaGrupo,
        mapa.mapaUsuarioCriacao,
      );
      if (!permitido) {
        return left(new NotAllowedError());
      }

      if (
        GRUPOS_MAPAS !== mapa.mapaGrupo &&
        !this.grupoAccessPolicy.canAssignToGrupo(ctx, GRUPOS_MAPAS)
      ) {
        return left(new NotAllowedError());
      }
    }

    mapa.setMapNome(NOM_NOME_MAPA);
    mapa.setMapGrupo(GRUPOS_MAPAS);
    mapa.setMapNivelCompartilhamento(NIVEL_COMPATILHAMENTO);
    mapa.setMapTitulo(DSC_TITULO);
    mapa.setMapDescricao(DSC_DESCRICAO);
    mapa.setMapBoundingBox(DSC_BOUNDING_BOX);
    mapa.setMapCarregamentoDefault(BOL_CARREGAMENTO_DEFAULT);

    if (COD_USUARIO_ULTIMA_ALTERACAO) {
      mapa.setMapUsuarioUltimaAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);
    }
    await this.mapasRepository.save(mapa);

    return right({
      mapa,
      camadas,
    });
  }
}
