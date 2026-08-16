import { Injectable } from '@nestjs/common';
import { CamadasRepository } from '../repositories/camadas-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface UpdateCamadaRequest {
  COD_CAMADA_ID: string;
  NOM_NOME: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  DSC_FONTE_DADOS_CAMADA: string;
  DSC_BOUNDING_BOX?: string;
  COD_USUARIO_ULTIMA_ALTERACAO?: string;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

@Injectable()
export class UpdateCamadaUseCase {
  constructor(
    private camadasRepository: CamadasRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_CAMADA_ID,
    NOM_NOME,
    DSC_TITULO,
    DSC_DESCRICAO,
    DSC_LINK_METADADOS,
    TXT_TERMOS_DE_USO,
    NIVEL_COMPATILHAMENTO,
    GRUPOS_CAMADAS,
    TXT_TAGS,
    DSC_FONTE_DADOS_CAMADA,
    DSC_BOUNDING_BOX,
    COD_USUARIO_ULTIMA_ALTERACAO,
    BOL_CARREGAMENTO_DEFAULT,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: UpdateCamadaRequest) {
    const camada = await this.camadasRepository.findById(
      COD_CAMADA_ID.toString(),
    );
    if (!camada) {
      throw new Error('Camada not found');
    }

    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      const permitido = this.grupoAccessPolicy.canEditGroupContentByGrupoId(
        ctx,
        camada.camadaGruposCamadas,
        camada.camadaUsuarioCriacao,
      );
      if (!permitido) {
        throw new NotAllowedError();
      }

      if (
        GRUPOS_CAMADAS !== camada.camadaGruposCamadas &&
        !this.grupoAccessPolicy.canAssignToGrupo(ctx, GRUPOS_CAMADAS)
      ) {
        throw new NotAllowedError();
      }
    }

    camada.setCamadaNome(NOM_NOME);
    camada.setCamadaTitulo(DSC_TITULO);
    camada.setCamadaDescricao(DSC_DESCRICAO);
    camada.setCamadaLinkMetadados(DSC_LINK_METADADOS);
    camada.setCamadaTermosDeUso(TXT_TERMOS_DE_USO);
    camada.setCamadaNivelCompartilhamento(NIVEL_COMPATILHAMENTO);
    camada.setCamadaGruposCamadas(GRUPOS_CAMADAS);
    camada.setCamadaTags(TXT_TAGS);
    camada.setCamadaFonteDadosCamada(DSC_FONTE_DADOS_CAMADA);
    camada.setCamadaCarregamentoDefault(!!BOL_CARREGAMENTO_DEFAULT);
    if (DSC_BOUNDING_BOX) {
      camada.setCamadaBoundingBox(DSC_BOUNDING_BOX);
    }
    if (COD_USUARIO_ULTIMA_ALTERACAO) {
      camada.setCamadaUsuarioAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);
    }
    await this.camadasRepository.save(camada);
  }
}
