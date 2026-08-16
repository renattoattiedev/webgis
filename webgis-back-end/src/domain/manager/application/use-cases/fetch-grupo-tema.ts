import { Either, right } from '@/core/either';
import { GrupoRepository } from '../repositories/grupo-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { Injectable } from '@nestjs/common';

interface FetchGrupoTemaUseCaseRequest {
  COD_TEMA_ID: string;
}

type FetchGrupoTemaUseCaseResponse = Either<
  null,
  {
    grupoTema: Grupo[];
  }
>;

@Injectable()
export class FetchGrupoTemasUseCase {
  constructor(private grupoRepository: GrupoRepository) {}

  async execute({
    COD_TEMA_ID,
  }: FetchGrupoTemaUseCaseRequest): Promise<FetchGrupoTemaUseCaseResponse> {
    const grupoTema =
      await this.grupoRepository.findManyByGrupoTemaId(COD_TEMA_ID);

    return right({
      grupoTema,
    });
  }
}
