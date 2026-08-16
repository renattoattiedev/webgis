import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';

export interface MetadadosRepublicacaoRaster {
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
}

interface RepublicarCamadaRasterRequest {
  COD_CAMADA_RASTER_ID: string;
  metadados: MetadadosRepublicacaoRaster;
  requesterId: string;
  perfilRequester: string | null;
}

type RepublicarCamadaRasterResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  { relativePath: string; nomeFlat: string }
>;

@Injectable()
export class RepublicarCamadaRasterUseCase {
  constructor(
    private camadasRasterRepository: CamadasRasterRepository,
    private policy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    metadados,
    requesterId,
    perfilRequester,
  }: RepublicarCamadaRasterRequest): Promise<RepublicarCamadaRasterResponse> {
    const camada =
      await this.camadasRasterRepository.findById(COD_CAMADA_RASTER_ID);
    if (!camada) {
      return left(new ResourceNotFoundError());
    }

    const ctx = await this.policy.buildContext(requesterId, perfilRequester);

    if (
      !this.policy.canEditGroupContentByGrupoId(
        ctx,
        camada.camadaGruposCamadas,
        camada.camadaUsuarioCriacao,
      )
    ) {
      return left(new NotAllowedError());
    }

    if (
      metadados.GRUPOS_CAMADAS !== camada.camadaGruposCamadas &&
      !this.policy.canAssignToGrupo(ctx, metadados.GRUPOS_CAMADAS)
    ) {
      return left(new NotAllowedError());
    }

    const relativePath = camada.camadaFonteDadosCamada;
    if (!relativePath) {
      return left(new ResourceNotFoundError());
    }

    camada.setCamadaTitulo(metadados.DSC_TITULO);
    camada.setCamadaDescricao(metadados.DSC_DESCRICAO);
    camada.setCamadaLinkMetadados(metadados.DSC_LINK_METADADOS);
    camada.setCamadaTermosDeUso(metadados.TXT_TERMOS_DE_USO);
    camada.setCamadaNivelCompartilhamento(metadados.NIVEL_COMPATILHAMENTO);
    camada.setCamadaGruposCamadas(metadados.GRUPOS_CAMADAS);
    camada.setCamadaTags(metadados.TXT_TAGS);
    camada.setCamadaCarregamentoDefault(
      metadados.BOL_CARREGAMENTO_DEFAULT ?? false,
    );
    camada.setCamadaUsuarioAlteracao(requesterId);

    await this.camadasRasterRepository.save(camada);

    return right({ relativePath, nomeFlat: camada.camadaNome });
  }
}
