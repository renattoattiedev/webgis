import { Either, right } from '@/core/either';
import { GrupoRepository } from '../repositories/grupo-repository';
import { Grupo } from '@/domain/manager/enterprise/entities/grupo';
import { Injectable } from '@nestjs/common';

interface FetchGrupoUseCaseRequest {
  COD_GRUPO_ID: string;
}

type FetchGrupoUseCaseResponse = Either<
  null,
  {
    grupo: Grupo[];
  }
>;

@Injectable()
export class FetchGrupoUseCase {
  constructor(private grupoRepository: GrupoRepository) {}

  async execute({
    COD_GRUPO_ID,
  }: FetchGrupoUseCaseRequest): Promise<FetchGrupoUseCaseResponse> {
    const grupo = await this.grupoRepository.findManyByGrupoId(COD_GRUPO_ID);

    return right({
      grupo,
    });
  }
}
