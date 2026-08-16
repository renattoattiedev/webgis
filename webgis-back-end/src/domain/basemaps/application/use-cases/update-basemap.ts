import { Injectable } from '@nestjs/common';
import { Either, right } from '@/core/either';
import { Basemap } from '../../enterprise/entities/basemap';
import { BasemapsRepository } from '../repositories/basemaps-repository';

interface UpdateBasemapUseCaseRequest {
  COD_BASEMAP_ID: string;
  NOM_NOME_BASEMAP: string;
  DSC_THUMBNAIL?: string | null;
  DSC_SOURCE: string;
  JSON_WMS_PARAMS?: any;
  NUM_ORDEM?: number;
  BOL_DEFAULT?: boolean;
  FLG_ATIVO?: boolean;
  COD_USUARIO_ULTIMA_ALTERACAO: string;
}

type UpdateBasemapUseCaseResponse = Either<
  Error,
  {
    basemap: Basemap;
  }
>;

@Injectable()
export class UpdateBasemapUseCase {
  constructor(private basemapsRepository: BasemapsRepository) {}

  async execute({
    COD_BASEMAP_ID,
    NOM_NOME_BASEMAP,
    DSC_THUMBNAIL,
    DSC_SOURCE,
    JSON_WMS_PARAMS,
    NUM_ORDEM,
    BOL_DEFAULT,
    FLG_ATIVO,
    COD_USUARIO_ULTIMA_ALTERACAO,
  }: UpdateBasemapUseCaseRequest): Promise<UpdateBasemapUseCaseResponse> {
    const basemap = await this.basemapsRepository.findById(COD_BASEMAP_ID);
    if (!basemap) {
      throw new Error('Basemap não encontrado');
    }

    basemap.setBasemapNome(NOM_NOME_BASEMAP);
    basemap.setBasemapThumbnail(DSC_THUMBNAIL ?? null);
    basemap.setBasemapSource(DSC_SOURCE);
    basemap.setBasemapWmsParams(JSON_WMS_PARAMS ?? null);
    basemap.setBasemapOrdem(NUM_ORDEM ?? 0);
    basemap.setBasemapDefault(BOL_DEFAULT ?? false);
    basemap.setBasemapAtivo(FLG_ATIVO ?? true);
    basemap.setBasemapUsuarioAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);

    await this.basemapsRepository.save(basemap);

    return right({
      basemap,
    });
  }
}
