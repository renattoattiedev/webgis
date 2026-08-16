import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadasRaster } from '../../enterprise/entities/camadas-raster';
import { CamadaRasterAlreadyExistsError } from './errors/camada-raster-already-exists-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CamadasRasterRepository } from '../repositories/camadas-raster-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface CreateCamadaRasterUseCaseRequest {
  COD_CAMADA_RASTER_ID: UniqueEntityID;
  NOM_NOME: string;
  DSC_FONTE_DADOS_CAMADA: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  DSC_BOUNDING_BOX?: string;
  DHS_INCLUSAO: Date;
  USUARIO_CRIACAO;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

type CreateCamadaRasterUseCaseResponse = Either<
  CamadaRasterAlreadyExistsError | NotAllowedError,
  {
    camadaRaster: CamadasRaster;
  }
>;

@Injectable()
export class CreateCamadaRasterUseCase {
  constructor(
    private camadasRasterRepository: CamadasRasterRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
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
    DHS_INCLUSAO,
    USUARIO_CRIACAO,
    BOL_CARREGAMENTO_DEFAULT,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: CreateCamadaRasterUseCaseRequest): Promise<CreateCamadaRasterUseCaseResponse> {
    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      if (!this.grupoAccessPolicy.canAssignToGrupo(ctx, GRUPOS_CAMADAS)) {
        return left(new NotAllowedError());
      }
    }

    const camadaRasterWithSameNome =
      await this.camadasRasterRepository.findByNomeFonte(
        NOM_NOME,
        DSC_FONTE_DADOS_CAMADA,
      );

    if (camadaRasterWithSameNome) {
      return left(new CamadaRasterAlreadyExistsError(NOM_NOME));
    }

    const camadaRaster = CamadasRaster.create({
      NOM_NOME,
      DSC_FONTE_DADOS_CAMADA,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_LINK_METADADOS,
      TXT_TERMOS_DE_USO,
      NIVEL_COMPATILHAMENTO,
      GRUPOS_CAMADAS,
      TXT_TAGS,
      DHS_INCLUSAO,
      DSC_BOUNDING_BOX,
      USUARIO_CRIACAO,
      FLG_CAMADA_ATIVA: true,
      BOL_CARREGAMENTO_DEFAULT,
    });

    await this.camadasRasterRepository.create(camadaRaster);

    return right({
      camadaRaster,
    });
  }
}
