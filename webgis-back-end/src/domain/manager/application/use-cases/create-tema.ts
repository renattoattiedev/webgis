import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { TemaAlreadyExistsError } from './errors/tema-already-exists-error';
import { Temas } from '../../enterprise/entities/temas';
import { TemasRepository } from '../repositories/temas-repository';

interface TemaUseCaseRequest {
  COD_TEMA_ID: UniqueEntityID;
  NOM_NOME_TEMA: string;
  USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
}

type TemaUseCaseResponse = Either<
  TemaAlreadyExistsError,
  {
    tema: Temas;
  }
>;

@Injectable()
export class CreateTemaUseCase {
  constructor(private temasRepository: TemasRepository) {}

  async execute({
    NOM_NOME_TEMA,
    USUARIO_CRIACAO,
    DHS_INCLUSAO,
  }: TemaUseCaseRequest): Promise<TemaUseCaseResponse> {
    const temaWithSameNome =
      await this.temasRepository.findByNome(NOM_NOME_TEMA);

    if (temaWithSameNome) {
      return left(new TemaAlreadyExistsError(NOM_NOME_TEMA));
    }

    const tema = Temas.create({
      NOM_NOME_TEMA,
      USUARIO_CRIACAO,
      DHS_INCLUSAO,
      USUARIO_ALTERACAO: null,
    });

    await this.temasRepository.create(tema);

    return right({
      tema,
    });
  }
}
