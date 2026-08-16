import { Camadas } from '@/domain/camadas/enterprise/entities/camadas';
import { CamadasRepository } from '../repositories/camadas-repository';
import { Either, left, right } from '@/core/either';
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error';
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error';
import { Injectable } from '@nestjs/common';

interface EditCamadaUseCaseRequest {
  COD_CAMADA_ID: string;
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
  DHS_ALTERACAO: Date;
  COD_USUARIO_ULTIMA_ALTERACAO: string;
}

type EditCamadaUseCaseResponse = Either<
  ResourceNotFoundError | NotAllowedError,
  {
    camadas: Camadas;
  }
>;

@Injectable()
export class EditCamadaUseCase {
  constructor(private camadasRepository: CamadasRepository) {}

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
    PACOTES_CONCEITUAIS,
    DSC_FONTE_DADOS_CAMADA,
    COD_USUARIO_ULTIMA_ALTERACAO,
  }: EditCamadaUseCaseRequest): Promise<EditCamadaUseCaseResponse> {
    const camadas = await this.camadasRepository.findById(
      COD_CAMADA_ID.toString(),
    );

    if (!camadas) {
      return left(new ResourceNotFoundError());
    }

    if (COD_CAMADA_ID !== camadas.id.toString()) {
      return left(new NotAllowedError());
    }
    camadas.setCamadaNome(NOM_NOME);
    camadas.setCamadaTitulo(DSC_TITULO);
    camadas.setCamadaDescricao(DSC_DESCRICAO);
    camadas.setCamadaLinkMetadados(DSC_LINK_METADADOS);
    camadas.setCamadaTermosDeUso(TXT_TERMOS_DE_USO);
    camadas.setCamadaNivelCompartilhamento(NIVEL_COMPATILHAMENTO);
    camadas.setCamadaGruposCamadas(GRUPOS_CAMADAS);
    camadas.setCamadaTags(TXT_TAGS);
    camadas.setCamadaPacotesConceituais(PACOTES_CONCEITUAIS);
    camadas.setCamadaFonteDadosCamada(DSC_FONTE_DADOS_CAMADA);
    camadas.setCamadaUsuarioAlteracao(COD_USUARIO_ULTIMA_ALTERACAO);

    await this.camadasRepository.save(camadas);

    return right({
      camadas,
    });
  }
}
