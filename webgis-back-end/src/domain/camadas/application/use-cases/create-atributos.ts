import { Either, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { CamadaAlreadyExistsError } from './errors/camada-already-exists-error';
import { AtributosRepository } from '../repositories/atributo-repository';
import { Atributos } from '../../enterprise/entities/atributos';

interface CreateAtributosUseCaseRequest {
  COD_CAMADA_ID: string;
  NOM_NOME_ATRIBUTO: string;
  DSC_TIPO: string;
  NUM_TAMANHO: number;
  NUM_ORDEM_RENDERIZACAO?: number;
  COD_USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
}

type CreateAtributosUseCaseResponse = Either<
  CamadaAlreadyExistsError,
  {
    atributos: Atributos;
  }
>;

@Injectable()
export class CreateAtributosUseCase {
  constructor(private atributosRepository: AtributosRepository) {}

  async execute({
    COD_CAMADA_ID,
    NOM_NOME_ATRIBUTO,
    DSC_TIPO,
    NUM_TAMANHO,
    NUM_ORDEM_RENDERIZACAO,
    COD_USUARIO_CRIACAO,
    DHS_INCLUSAO,
  }: CreateAtributosUseCaseRequest): Promise<CreateAtributosUseCaseResponse> {
    const atributos = Atributos.create({
      COD_CAMADA_ID,
      NOM_NOME_ATRIBUTO,
      FLG_VISIVEL: true,
      DSC_TIPO,
      NUM_TAMANHO,
      NUM_ORDEM_RENDERIZACAO,
      COD_USUARIO_CRIACAO,
      DHS_INCLUSAO,
      DSC_LABEL_ATRIBUTO: '',
      TXT_DESCRICAO: '',
    });

    await this.atributosRepository.create(atributos);

    return right({
      atributos,
    });
  }
}
