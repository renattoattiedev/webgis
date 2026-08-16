import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { Camadas } from '../../enterprise/entities/camadas';
import { CamadaAlreadyExistsError } from './errors/camada-already-exists-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { CamadasRepository } from '../repositories/camadas-repository';
import { GrupoAccessPolicy } from '@/domain/manager/application/services/grupo-access-policy';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';

interface CreateCamadaUseCaseRequest {
  COD_CAMADA_ID: UniqueEntityID;
  NOM_NOME: string;
  DSC_TITULO: string;
  DSC_DESCRICAO: string;
  DSC_LINK_METADADOS: string;
  TXT_TERMOS_DE_USO: string;
  NIVEL_COMPATILHAMENTO: string;
  GRUPOS_CAMADAS: string;
  TXT_TAGS: string;
  PACOTES_CONCEITUAIS: string;
  DSC_FONTE_DADOS_CAMADA: string;
  DSC_BOUNDING_BOX?: string;
  DHS_INCLUSAO: Date;
  USUARIO_CRIACAO;
  BOL_CARREGAMENTO_DEFAULT?: boolean;
  COD_USER_SOLICITANTE?: string;
  DSC_PERFIL_SOLICITANTE?: string | null;
}

type CreateCamadaUseCaseResponse = Either<
  CamadaAlreadyExistsError | NotAllowedError,
  {
    camada: Camadas;
  }
>;

@Injectable()
export class CreateCamadaUseCase {
  constructor(
    private camadasRepository: CamadasRepository,
    private grupoAccessPolicy: GrupoAccessPolicy,
  ) {}

  async execute({
    NOM_NOME,
    DSC_TITULO,
    DSC_DESCRICAO,
    DSC_LINK_METADADOS,
    TXT_TERMOS_DE_USO,
    NIVEL_COMPATILHAMENTO,
    GRUPOS_CAMADAS,
    TXT_TAGS,
    PACOTES_CONCEITUAIS,
    DSC_FONTE_DADOS_CAMADA,
    DSC_BOUNDING_BOX,
    DHS_INCLUSAO,
    USUARIO_CRIACAO,
    BOL_CARREGAMENTO_DEFAULT,
    COD_USER_SOLICITANTE,
    DSC_PERFIL_SOLICITANTE,
  }: CreateCamadaUseCaseRequest): Promise<CreateCamadaUseCaseResponse> {
    if (COD_USER_SOLICITANTE) {
      const ctx = await this.grupoAccessPolicy.buildContext(
        COD_USER_SOLICITANTE,
        DSC_PERFIL_SOLICITANTE ?? null,
      );
      if (!this.grupoAccessPolicy.canAssignToGrupo(ctx, GRUPOS_CAMADAS)) {
        return left(new NotAllowedError());
      }
    }

    const camadaWithSameNome =
      await this.camadasRepository.findByNome(NOM_NOME);

    if (camadaWithSameNome) {
      return left(new CamadaAlreadyExistsError(NOM_NOME));
    }

    const camada = Camadas.create({
      NOM_NOME,
      DSC_TITULO,
      DSC_DESCRICAO,
      DSC_LINK_METADADOS,
      TXT_TERMOS_DE_USO,
      NIVEL_COMPATILHAMENTO,
      GRUPOS_CAMADAS,
      TXT_TAGS,
      PACOTES_CONCEITUAIS,
      DSC_FONTE_DADOS_CAMADA,
      DHS_INCLUSAO,
      DSC_BOUNDING_BOX,
      USUARIO_CRIACAO,
      FLG_CAMADA_ATIVA: true,
      BOL_CARREGAMENTO_DEFAULT,
    });

    await this.camadasRepository.create(camada);

    return right({
      camada,
    });
  }
}
