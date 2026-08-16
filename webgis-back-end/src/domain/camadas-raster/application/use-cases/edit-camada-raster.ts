import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { Injectable } from '@nestjs/common';
import { CamadasRaster } from '../../enterprise/entities/camadas-raster';

interface EditCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: string;
  NOM_NOME: string;
  DSC_FONTE_DADOS_CAMADA: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  DHS_ALTERACAO: Date;
  COD_USUARIO_ULTIMA_ALTERACAO: string;
}

type EditCamadaRasterUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    camadasRaster: CamadasRaster;
  }
>;

@Injectable()
export class EditCamadaRasterUseCase {
  constructor(private camadasRasterRepository: CamadasRasterRepository) {}

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
    COD_USUARIO_ULTIMA_ALTERACAO,
  }: EditCamadaRasterUseCaseRequest): Promise<EditCamadaRasterUseCaseResponse> {
    const camadasRaster = await this.camadasRasterRepository.findById(
      COD_CAMADA_RASTER_ID.toString(),
    );

    if (!camadasRaster) {
      return left(new ResourceNotFoundError());
    }

    if (COD_CAMADA_RASTER_ID !== camadasRaster.id.toString()) {
      return left(new NotAllowedError());
    }
    camadasRaster.setCamadaNome(NOM_NOME);
    camadasRaster.setCamadaTitulo(DSC_TITULO);
    camadasRaster.setCamadaDescricao(DSC_DESCRICAO);
    camadasRaster.setCamadaLinkMetadados(DSC_LINK_METADADOS);
    camadasRaster.setCamadaTermosDeUso(TXT_TERMOS_DE_USO);
    camadasRaster.setCamadaNivelCompartilhamento(NIVEL_COMPATILHAMENTO);
    camadasRaster.setCamadaGruposCamadas(GRUPOS_CAMADAS);
    camadasRaster.setCamadaTags(TXT_TAGS);
    camadasRaster.setCamadaUsuarioAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);

    if (DSC_FONTE_DADOS_CAMADA) {
      camadasRaster.setCamadaFonteDadosCamada(DSC_FONTE_DADOS_CAMADA);
    }

    await this.camadasRasterRepository.save(camadasRaster);

    return right({
      camadasRaster,
    });
  }
}
