import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Basemap } from '../../enterprise/entities/basemap';
import { BasemapsRepository } from '../repositories/basemaps-repository';

interface CreateBasemapUseCaseRequest {
  NOM_NOME_BASEMAP: string;
  DSC_THUMBNAIL?: string | null;
  DSC_SOURCE: string;
  JSON_WMS_PARAMS?: any;
  NUM_ORDEM?: number;
  BOL_DEFAULT?: boolean;
  FLG_ATIVO?: boolean;
  COD_USUARIO_CRIACAO: string;
}

type CreateBasemapUseCaseResponse = Either<
  Error,
  {
    basemap: Basemap;
  }
>;

@Injectable()
export class CreateBasemapUseCase {
  constructor(private basemapsRepository: BasemapsRepository) {}

  async execute({
    NOM_NOME_BASEMAP,
    DSC_THUMBNAIL,
    DSC_SOURCE,
    JSON_WMS_PARAMS,
    NUM_ORDEM,
    BOL_DEFAULT,
    FLG_ATIVO,
    COD_USUARIO_CRIACAO,
  }: CreateBasemapUseCaseRequest): Promise<CreateBasemapUseCaseResponse> {
    const basemapWithSameNome =
      await this.basemapsRepository.findByNome(NOM_NOME_BASEMAP);

    if (basemapWithSameNome) {
      return left(new Error('Basemap já existe com esse nome'));
    }

    const basemap = Basemap.create({
      NOM_NOME_BASEMAP,
      DSC_THUMBNAIL: DSC_THUMBNAIL ?? null,
      DSC_SOURCE,
      JSON_WMS_PARAMS: JSON_WMS_PARAMS ?? null,
      NUM_ORDEM: NUM_ORDEM ?? 0,
      BOL_DEFAULT: BOL_DEFAULT ?? false,
      FLG_ATIVO: FLG_ATIVO ?? true,
      COD_USUARIO_CRIACAO,
      COD_USUARIO_ULTIMA_ALTERACAO: null,
      COD_USUARIO_EXCLUSAO: null,
      DHS_EXCLUSAO: null,
      DHS_INCLUSAO: new Date(),
      DHS_ULTIMA_ALTERACAO: null,
    });

    await this.basemapsRepository.create(basemap);

    return right({
      basemap,
    });
  }
}
