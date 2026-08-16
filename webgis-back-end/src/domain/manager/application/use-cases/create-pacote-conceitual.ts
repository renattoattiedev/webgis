import { Either, left, right } from '@/core/either';
import { Injectable } from '@nestjs/common';
import { PacotesConceituais } from '../../enterprise/entities/pacotes-conceituais';
import { PacoteConceitualAlreadyExistsError } from './errors/pacote-conceitual-already-exists-error';
import { UniqueEntityID } from '@/core/entities/unique-entity-id';
import { PacotesConceituaisRepository } from '../repositories/pacotes-conceituais-repository';

interface PacoteConceitualUseCaseRequest {
  COD_PACOTE_CONCEITUAL_ID: UniqueEntityID;
  NOM_NOME_PACOTE_CONCEITUAL: string;
  DSC_TITULO: string;
  DSC_HOST: string;
  DSC_PORT: string;
  DSC_DATABASE: string;
  DSC_SCHEMA: string;
  DSC_USER: string;
  DSC_PASSWORD: string;
  USUARIO_CRIACAO: string;
  DHS_INCLUSAO: Date;
}

type PacoteConceitualCamadaUseCaseResponse = Either<
  PacoteConceitualAlreadyExistsError,
  {
    pacoteConceitual: PacotesConceituais;
  }
>;

@Injectable()
export class CreatePacoteConceitualUseCase {
  constructor(
    private pacotesConceituaisRepository: PacotesConceituaisRepository,
  ) {}

  async execute({
    NOM_NOME_PACOTE_CONCEITUAL,
    DSC_TITULO,
    DSC_HOST,
    DSC_PORT,
    DSC_DATABASE,
    DSC_SCHEMA,
    DSC_USER,
    DSC_PASSWORD,
    USUARIO_CRIACAO,
    DHS_INCLUSAO,
  }: PacoteConceitualUseCaseRequest): Promise<PacoteConceitualCamadaUseCaseResponse> {
    const pacoteConceitualWithSameNome =
      await this.pacotesConceituaisRepository.findByNome(
        NOM_NOME_PACOTE_CONCEITUAL,
      );

    if (pacoteConceitualWithSameNome) {
      return left(
        new PacoteConceitualAlreadyExistsError(NOM_NOME_PACOTE_CONCEITUAL),
      );
    }

    const pacoteConceitual = PacotesConceituais.create({
      NOM_NOME_PACOTE_CONCEITUAL,
      DSC_TITULO,
      DSC_HOST,
      DSC_PORT,
      DSC_DATABASE,
      DSC_SCHEMA,
      DSC_USER,
      DSC_PASSWORD,
      USUARIO_CRIACAO,
      DHS_INCLUSAO,
    });

    await this.pacotesConceituaisRepository.create(pacoteConceitual);

    return right({
      pacoteConceitual,
    });
  }
}
