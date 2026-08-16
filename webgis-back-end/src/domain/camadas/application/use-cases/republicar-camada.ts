import { Injectable } from '@nestjs/common';
import { Either, left, right } from '@/core/either';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { CamadasRepository } from '../repositories/camadas-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';

export interface MetadadosRepublicacao {
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  DSC_FONTE_DADOS_CAMADA: string;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
}

interface RepublicarCamadaRequest {
  COD_CAMADA_ID: string;
  metadados: MetadadosRepublicacao;
  requesterId: string;
  perfilRequester: string | null;
}

type RepublicarCamadaResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  null
>;

/**
 * Só valida permissões e persiste os metadados + status 'publishing'. O
 * trabalho pesado (GeoServer + reconciliação de atributos) roda em
 * background via `RepublicarCamadaRunner`, chamado pelo controller depois
 * que este use-case retorna — evita segurar a requisição HTTP (e o diálogo
 * no frontend) enquanto o GeoServer recalcula o bounding box, o que pode
 * levar minutos em camadas grandes.
 */
@Injectable()
export class RepublicarCamadaUseCase {
  constructor(
    private camadasRepository: CamadasRepository,
    private policy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_CAMADA_ID,
    metadados,
    requesterId,
    perfilRequester,
  }: RepublicarCamadaRequest): Promise<RepublicarCamadaResponse> {
    const camada = await this.camadasRepository.findById(COD_CAMADA_ID);
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

    const mudouDeGrupo =
      metadados.GRUPOS_CAMADAS !== camada.camadaGruposCamadas;

    if (
      mudouDeGrupo &&
      !this.policy.canAssignToGrupo(ctx, metadados.GRUPOS_CAMADAS)
    ) {
      return left(new NotAllowedError());
    }

    camada.setCamadaTitulo(metadados.DSC_TITULO);
    camada.setCamadaDescricao(metadados.DSC_DESCRICAO);
    camada.setCamadaLinkMetadados(metadados.DSC_LINK_METADADOS);
    camada.setCamadaTermosDeUso(metadados.TXT_TERMOS_DE_USO);
    camada.setCamadaNivelCompartilhamento(metadados.NIVEL_COMPATILHAMENTO);
    camada.setCamadaGruposCamadas(metadados.GRUPOS_CAMADAS);
    camada.setCamadaTags(metadados.TXT_TAGS);
    camada.setCamadaFonteDadosCamada(metadados.DSC_FONTE_DADOS_CAMADA);
    camada.setCamadaCarregamentoDefault(
      metadados.BOL_CARREGAMENTO_DEFAULT ?? false,
    );
    camada.setCamadaUsuarioAlteracao(requesterId);
    camada.setCamadaStatus('publishing');
    camada.setCamadaErrorMsg(null);

    await this.camadasRepository.save(camada);

    return right(null);
  }
}
