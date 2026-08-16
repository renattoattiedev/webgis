import { Injectable } from '@nestjs/common';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface UpdateCamadaRasterRequest {
  COD_CAMADA_RASTER_ID: string;
  NOM_NOME: string;
  DSC_FONTE_DADOS_CAMADA?: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  DSC_BOUNDING_BOX?: string;
  COD_USUARIO_ULTIMA_ALTERACAO?: string;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

@Injectable()
export class UpdateCamadaRasterUseCase {
  constructor(
    private camadasRasterRepository: CamadasRasterRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    COD_CAMADA_RASTER_ID,
    NOM_NOME,
    DSC_FONTE_DADOS_CAMADA,
    DSC_TITULO,
    DSC_DESCRICAO,
    DSC_LINK_METADADOS,
    TXT_TERMOS_DE_USO,
    NIVEL_COMPATILHAMENTO,
    GRUPOS_CAMADAS,
    TXT_TAGS,
    DSC_BOUNDING_BOX,
    COD_USUARIO_ULTIMA_ALTERACAO,
    BOL_CARREGAMENTO_DEFAULT,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: UpdateCamadaRasterRequest) {
    const camadaRaster = await this.camadasRasterRepository.findById(
      COD_CAMADA_RASTER_ID.toString(),
    );
    if (!camadaRaster) {
      throw new Error('Camada Raster not found');
    }

    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      const permitido = this.grupoAccessPolicy.canEditGroupContentByGrupoId(
        ctx,
        camadaRaster.camadaGruposCamadas,
        camadaRaster.camadaUsuarioCriacao,
      );
      if (!permitido) {
        throw new NotAllowedError();
      }

      if (
        GRUPOS_CAMADAS !== camadaRaster.camadaGruposCamadas &&
        !this.grupoAccessPolicy.canAssignToGrupo(ctx, GRUPOS_CAMADAS)
      ) {
        throw new NotAllowedError();
      }
    }

    camadaRaster.setCamadaNome(NOM_NOME);
    camadaRaster.setCamadaTitulo(DSC_TITULO);
    camadaRaster.setCamadaDescricao(DSC_DESCRICAO);
    camadaRaster.setCamadaLinkMetadados(DSC_LINK_METADADOS);
    camadaRaster.setCamadaTermosDeUso(TXT_TERMOS_DE_USO);
    camadaRaster.setCamadaNivelCompartilhamento(NIVEL_COMPATILHAMENTO);
    camadaRaster.setCamadaGruposCamadas(GRUPOS_CAMADAS);
    camadaRaster.setCamadaTags(TXT_TAGS);
    camadaRaster.setCamadaCarregamentoDefault(!!BOL_CARREGAMENTO_DEFAULT);
    if (DSC_FONTE_DADOS_CAMADA) {
      camadaRaster.setCamadaFonteDadosCamada(DSC_FONTE_DADOS_CAMADA);
    }
    if (DSC_BOUNDING_BOX) {
      camadaRaster.setCamadaBoundingBox(DSC_BOUNDING_BOX);
    }
    if (COD_USUARIO_ULTIMA_ALTERACAO) {
      camadaRaster.setCamadaUsuarioAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);
    }
    await this.camadasRasterRepository.save(camadaRaster);
  }
}
